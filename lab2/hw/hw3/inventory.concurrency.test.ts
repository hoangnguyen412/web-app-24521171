import {
  InventoryStateMachine,
  type InventorySnapshot
} from "./inventory.js";

interface TestCase {
  name: string;
  run: () => void | Promise<void>;
}

interface SuccessfulReservation {
  buyerIndex: number;
  id: string;
}

const tests: TestCase[] = [];

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected ${String(expected)}, got ${String(actual)}`
    );
  }
}

function assertStockInvariant(snapshot: InventorySnapshot): void {
  const quantities = [
    snapshot.initialStock,
    snapshot.available,
    snapshot.reserved,
    snapshot.sold,
    snapshot.version
  ];

  assert(
    quantities.every(Number.isSafeInteger),
    "All inventory quantities and version must be safe integers"
  );

  assert(
    quantities.every((value) => value >= 0),
    "Inventory quantities and version must never be negative"
  );

  equal(
    snapshot.available + snapshot.reserved + snapshot.sold,
    snapshot.initialStock,
    "Inventory conservation invariant"
  );
}

function observeInventory(machine: InventoryStateMachine): void {
  // Check invariants after every inventory notification,
  // including automatic reservation expiry.
  machine.subscribe((snapshot) => {
    assertStockInvariant(snapshot);
  });
}

function assertSnapshotEqual(
  actual: InventorySnapshot,
  expected: InventorySnapshot
): void {
  equal(actual.initialStock, expected.initialStock, "initialStock");
  equal(actual.available, expected.available, "available");
  equal(actual.reserved, expected.reserved, "reserved");
  equal(actual.sold, expected.sold, "sold");
  equal(actual.version, expected.version, "version");
}

function assertReservationAccounting(
  machine: InventoryStateMachine,
  reservationIds: string[]
): void {
  const snapshot = machine.getSnapshot();
  let activeReserved = 0;
  let completedSold = 0;

  for (const id of reservationIds) {
    const reservation = machine.getReservation(id);

    assert(reservation, `Reservation ${id} must exist`);

    if (reservation.status === "reserved") {
      activeReserved += reservation.quantity;
    } else if (reservation.status === "checked_out") {
      completedSold += reservation.quantity;
    }
  }

  equal(activeReserved, snapshot.reserved, "Active reservation total");
  equal(completedSold, snapshot.sold, "Completed checkout total");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function test(name: string, run: TestCase["run"]): void {
  tests.push({ name, run });
}

test("100 buyers sharing one version cannot reserve the last unit", async () => {
  const machine = new InventoryStateMachine(1);
  observeInventory(machine);

  const sharedVersion = machine.getSnapshot().version;

  const results = await Promise.all(
    Array.from({ length: 100 }, () =>
      Promise.resolve().then(() =>
        machine.reserve(1, sharedVersion, 5000)
      )
    )
  );

  const successes = results.filter((result) => result.success);
  const failures = results.filter((result) => !result.success);

  equal(successes.length, 1, "Successful reservations");
  equal(failures.length, 99, "Rejected reservations");

  for (const result of failures) {
    assert(!result.success, "Request should be rejected");
    equal(result.error.code, "STALE_VERSION", "Failure code");
  }

  assertSnapshotEqual(machine.getSnapshot(), {
    initialStock: 1,
    available: 0,
    reserved: 1,
    sold: 0,
    version: 1
  });
});

test("100 buyers cannot oversell 25 available units", async () => {
  const machine = new InventoryStateMachine(25);
  observeInventory(machine);

  const results = await Promise.all(
    Array.from({ length: 100 }, () =>
      Promise.resolve().then(() => {
        // Each buyer reads the latest version before attempting a reservation.
        const version = machine.getSnapshot().version;
        return machine.reserve(1, version, 5000);
      })
    )
  );

  const successes = results.filter((result) => result.success);
  const failures = results.filter((result) => !result.success);

  equal(successes.length, 25, "Successful reservations");
  equal(failures.length, 75, "Rejected reservations");

  for (const result of failures) {
    assert(!result.success, "Request should be rejected");
    equal(result.error.code, "INSUFFICIENT_STOCK", "Failure code");
  }

  assertStockInvariant(machine.getSnapshot());

  assertSnapshotEqual(machine.getSnapshot(), {
    initialStock: 25,
    available: 0,
    reserved: 25,
    sold: 0,
    version: 25
  });

  assertReservationAccounting(
    machine,
    successes.map((result) => {
      assert(result.success, "Reservation must succeed");
      return result.data.id;
    })
  );
});

test("many buyers exercise reservation, checkout, and expiry", async () => {
  const initialStock = 60;
  const machine = new InventoryStateMachine(initialStock);

  observeInventory(machine);

  const reservationIds: SuccessfulReservation[] = [];
  let rejectedCount = 0;

  const buyers = await Promise.all(
    Array.from({ length: 200 }, async (_, buyerIndex) => {
      // Allow buyer requests to enter the event loop together.
      await Promise.resolve();

      const expectedVersion = machine.getSnapshot().version;
      const lockDurationMs = 200 + (buyerIndex % 3) * 25;

      const result = machine.reserve(
        1,
        expectedVersion,
        lockDurationMs
      );

      assertStockInvariant(machine.getSnapshot());

      if (!result.success) {
        equal(
          result.error.code,
          "INSUFFICIENT_STOCK",
          "Rejected buyer reason"
        );

        rejectedCount += 1;
        return;
      }

      reservationIds.push({
        buyerIndex,
        id: result.data.id
      });

      assertReservationAccounting(
        machine,
        reservationIds.map((reservation) => reservation.id)
      );

      if (buyerIndex % 3 === 0) {
        // One group checks out immediately.
        const checkout = machine.checkout(
          result.data.id,
          machine.getSnapshot().version
        );

        assert(checkout.success, "Checkout before expiry should succeed");
        assertStockInvariant(machine.getSnapshot());
      } else if (buyerIndex % 3 === 1) {
        // One group leaves reservations to expire automatically.
        await delay(350);

        equal(
          machine.getReservation(result.data.id)?.status,
          "expired",
          "Automatic expiry status"
        );
      } else {
        // The final group tries checkout after the lock has expired.
        await delay(350);

        const lateCheckout = machine.checkout(
          result.data.id,
          machine.getSnapshot().version
        );

        assert(!lateCheckout.success, "Late checkout must fail");

        if (!lateCheckout.success) {
          equal(
            lateCheckout.error.code,
            "RESERVATION_EXPIRED",
            "Late checkout error"
          );
        }

        equal(
          machine.getReservation(result.data.id)?.status,
          "expired",
          "Expired reservation must remain expired"
        );
      }

      assertStockInvariant(machine.getSnapshot());
    })
  );

  // Every buyer task should finish without throwing.
  equal(buyers.length, 200, "Processed buyers");

  assert(rejectedCount > 0, "Some buyers must be rejected for limited stock");

  await delay(400);

  const snapshot = machine.getSnapshot();
  assertStockInvariant(snapshot);

  equal(snapshot.reserved, 0, "No reservations should remain active");
  equal(snapshot.sold + snapshot.available, initialStock, "Final stock total");

  const ids = reservationIds.map((reservation) => reservation.id);

  assertReservationAccounting(machine, ids);

  let expectedSold = 0;

  for (const reservation of reservationIds) {
    const current = machine.getReservation(reservation.id);

    assert(current, "Successful reservation must exist");

    if (reservation.buyerIndex % 3 === 0) {
      equal(current.status, "checked_out", "Immediate checkout status");
      expectedSold += current.quantity;
    } else {
      equal(current.status, "expired", "Expired reservation status");
    }
  }

  equal(snapshot.sold, expectedSold, "Sold quantity after contention");

  // A terminal reservation must never be finalized a second time.
  for (const { id } of reservationIds) {
    const currentReservation = machine.getReservation(id);
    assert(currentReservation, "Reservation must exist");

    const beforeRetry = machine.getSnapshot();

    const repeatedTransition = machine.transitionReservation(
      id,
      currentReservation.status === "checked_out"
        ? "expired"
        : "checked_out",
      beforeRetry.version
    );

    assert(!repeatedTransition.success, "Repeated finalization must fail");

    assertSnapshotEqual(machine.getSnapshot(), beforeRetry);
  }
});

test("checkout and expiry racing cannot finalize one reservation twice", async () => {
  const rounds = 25;

  await Promise.all(
    Array.from({ length: rounds }, async () => {
      const machine = new InventoryStateMachine(1);
      observeInventory(machine);

      const reservation = machine.reserve(1, 0, 25);

      assert(reservation.success, "Initial reservation should succeed");

      const reservationId = reservation.data.id;
      const sameVersion = reservation.inventory.version;

      // Both actions compete using the same version near the lock deadline.
      const [checkout, expiry] = await Promise.all([
        delay(25).then(() =>
          machine.checkout(reservationId, sameVersion)
        ),
        delay(25).then(() =>
          machine.expireReservation(reservationId, sameVersion)
        )
      ]);

      // Allow any queued automatic expiry callback to finish.
      await delay(40);

      const terminalSuccesses = [
        checkout,
        expiry
      ].filter((result) => result.success);

      assert(
        terminalSuccesses.length <= 1,
        "Checkout and explicit expiry must not both succeed"
      );

      const finalReservation = machine.getReservation(reservationId);
      assert(finalReservation, "Reservation must exist");

      assert(
        finalReservation.status === "checked_out" ||
          finalReservation.status === "expired",
        "Reservation must finish in exactly one terminal state"
      );

      const snapshot = machine.getSnapshot();
      assertStockInvariant(snapshot);

      equal(snapshot.reserved, 0, "Reserved quantity after race");

      if (finalReservation.status === "checked_out") {
        equal(snapshot.available, 0, "Available after checkout");
        equal(snapshot.sold, 1, "Sold after checkout");
      } else {
        equal(snapshot.available, 1, "Available after expiry");
        equal(snapshot.sold, 0, "Sold after expiry");
      }

      equal(snapshot.version, 2, "Exactly one terminal mutation");

      const beforeRetry = machine.getSnapshot();

      const retry = machine.transitionReservation(
        reservationId,
        finalReservation.status === "checked_out"
          ? "expired"
          : "checked_out",
        beforeRetry.version
      );

      assert(!retry.success, "Terminal reservation cannot transition again");
      assertSnapshotEqual(machine.getSnapshot(), beforeRetry);
    })
  );
});

async function runTests(): Promise<void> {
  let passed = 0;
  const failures: string[] = [];

  for (const current of tests) {
    try {
      await current.run();
      passed += 1;
      console.log(`✔ ${current.name}`);
    } catch (error) {
      failures.push(current.name);
      console.error(`✘ ${current.name}`);
      console.error(error);
    }
  }

  console.log(`\nTests passed: ${passed}/${tests.length}`);

  if (failures.length > 0) {
    throw new Error(`Failed tests: ${failures.join(", ")}`);
  }
}

void runTests();