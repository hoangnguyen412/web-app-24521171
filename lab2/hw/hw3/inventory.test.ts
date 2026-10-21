import {
  InventoryStateMachine,
  isValidReservationTransition,
  type InventorySnapshot
} from "./inventory.js";

interface TestCase {
  name: string;
  run: () => void | Promise<void>;
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

function assertSnapshot(
  actual: InventorySnapshot,
  expected: InventorySnapshot
): void {
  equal(actual.initialStock, expected.initialStock, "initialStock");
  equal(actual.available, expected.available, "available");
  equal(actual.reserved, expected.reserved, "reserved");
  equal(actual.sold, expected.sold, "sold");
  equal(actual.version, expected.version, "version");
}

function test(name: string, run: TestCase["run"]): void {
  tests.push({ name, run });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("reservation moves stock and increments version once", () => {
  const machine = new InventoryStateMachine(10);
  const result = machine.reserve(4, 0);

  assert(result.success, "Reservation should succeed");
  equal(result.data.status, "reserved", "Reservation status");
  equal(result.inventory.version, 1, "Version after reservation");

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 10,
    available: 6,
    reserved: 4,
    sold: 0,
    version: 1
  });
});

test("rejects invalid quantities without changing stock", () => {
  const machine = new InventoryStateMachine(10);
  const initial = machine.getSnapshot();

  for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
    const result = machine.reserve(quantity, 0);

    assert(!result.success, "Invalid quantity must fail");

    if (!result.success) {
      equal(result.error.code, "INVALID_QUANTITY", "Error code");
    }

    assertSnapshot(machine.getSnapshot(), initial);
  }
});

test("rejects reservations exceeding available stock", () => {
  const machine = new InventoryStateMachine(3);
  const first = machine.reserve(3, 0);

  assert(first.success, "First reservation should succeed");

  const before = machine.getSnapshot();
  const result = machine.reserve(1, before.version);

  assert(!result.success, "Overselling must be rejected");

  if (!result.success) {
    equal(result.error.code, "INSUFFICIENT_STOCK", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), before);
});

test("checkout before expiry succeeds and moves stock to sold", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(4, 0, 5000);

  assert(reservation.success, "Reservation should succeed");

  const result = machine.checkout(
    reservation.data.id,
    reservation.inventory.version
  );

  assert(result.success, "Checkout before expiry should succeed");

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 10,
    available: 6,
    reserved: 0,
    sold: 4,
    version: 2
  });
});

test("expiry timer releases reserved stock automatically", async () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(4, 0, 20);

  assert(reservation.success, "Reservation should succeed");

  await delay(60);

  equal(
    machine.getReservation(reservation.data.id)?.status,
    "expired",
    "Reservation status"
  );

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 10,
    available: 10,
    reserved: 0,
    sold: 0,
    version: 2
  });
});

test("checkout after expiry fails without selling stock", async () => {
  const machine = new InventoryStateMachine(5);
  const reservation = machine.reserve(2, 0, 20);

  assert(reservation.success, "Reservation should succeed");

  await delay(60);

  const beforeCheckout = machine.getSnapshot();
  const result = machine.checkout(
    reservation.data.id,
    beforeCheckout.version
  );

  assert(!result.success, "Checkout after expiry must fail");

  if (!result.success) {
    equal(result.error.code, "RESERVATION_EXPIRED", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), beforeCheckout);

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 5,
    available: 5,
    reserved: 0,
    sold: 0,
    version: 2
  });
});

test("cannot manually expire a reservation before its deadline", () => {
  const machine = new InventoryStateMachine(5);
  const reservation = machine.reserve(2, 0, 5000);

  assert(reservation.success, "Reservation should succeed");

  const before = machine.getSnapshot();
  const result = machine.expireReservation(
    reservation.data.id,
    before.version
  );

  assert(!result.success, "Early expiry must fail");

  if (!result.success) {
    equal(result.error.code, "LOCK_NOT_EXPIRED", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), before);
});

test("stale reservation update changes nothing", () => {
  const machine = new InventoryStateMachine(5);
  const first = machine.reserve(1, 0, 5000);

  assert(first.success, "Initial reservation should succeed");

  const before = machine.getSnapshot();
  const stale = machine.reserve(1, 0);

  assert(!stale.success, "Stale reservation must fail");

  if (!stale.success) {
    equal(stale.error.code, "STALE_VERSION", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), before);
});

test("stale checkout cannot change reservation or inventory", () => {
  const machine = new InventoryStateMachine(5);
  const reservation = machine.reserve(2, 0, 5000);

  assert(reservation.success, "Reservation should succeed");

  const before = machine.getSnapshot();
  const stale = machine.checkout(reservation.data.id, 0);

  assert(!stale.success, "Stale checkout must fail");

  if (!stale.success) {
    equal(stale.error.code, "STALE_VERSION", "Error code");
  }

  equal(
    machine.getReservation(reservation.data.id)?.status,
    "reserved",
    "Reservation status"
  );

  assertSnapshot(machine.getSnapshot(), before);
});

test("two buyers using the same version cannot reserve the last unit", () => {
  const machine = new InventoryStateMachine(1);
  const sharedVersion = machine.getSnapshot().version;

  const buyerA = machine.reserve(1, sharedVersion, 5000);
  assert(buyerA.success, "First buyer should succeed");

  const afterBuyerA = machine.getSnapshot();
  const buyerB = machine.reserve(1, sharedVersion);

  assert(!buyerB.success, "Second stale request must fail");

  if (!buyerB.success) {
    equal(buyerB.error.code, "STALE_VERSION", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), afterBuyerA);

  const retry = machine.reserve(1, machine.getSnapshot().version);
  assert(!retry.success, "No stock remains");

  if (!retry.success) {
    equal(retry.error.code, "INSUFFICIENT_STOCK", "Error code");
  }
});

test("checkout and expiry cannot finalize the same reservation twice", async () => {
  const machine = new InventoryStateMachine(1);
  const reservation = machine.reserve(1, 0, 20);

  assert(reservation.success, "Reservation should succeed");

  await delay(60);

  const expiredSnapshot = machine.getSnapshot();
  const result = machine.checkout(
    reservation.data.id,
    expiredSnapshot.version
  );

  assert(!result.success, "Checkout must not succeed after expiry");
  assertSnapshot(machine.getSnapshot(), expiredSnapshot);

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 1,
    available: 1,
    reserved: 0,
    sold: 0,
    version: 2
  });
});

test("rejects invalid and repeated state transitions", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(2, 0, 5000);

  assert(reservation.success, "Reservation should succeed");

  const invalid = machine.transitionReservation(
    reservation.data.id,
    "reserved",
    machine.getSnapshot().version
  );

  assert(!invalid.success, "Repeated reserved status must fail");

  if (!invalid.success) {
    equal(invalid.error.code, "INVALID_TRANSITION", "Error code");
  }

  const checkout = machine.checkout(
    reservation.data.id,
    machine.getSnapshot().version
  );

  assert(checkout.success, "Checkout should succeed");

  const afterCheckout = machine.getSnapshot();
  const expiry = machine.expireReservation(
    reservation.data.id,
    afterCheckout.version
  );

  assert(!expiry.success, "Checked-out reservation cannot expire");
  assertSnapshot(machine.getSnapshot(), afterCheckout);
});

test("rejects unknown reservation IDs", () => {
  const machine = new InventoryStateMachine(5);
  const result = machine.checkout("missing-reservation", 0);

  assert(!result.success, "Unknown reservation must fail");

  if (!result.success) {
    equal(result.error.code, "RESERVATION_NOT_FOUND", "Error code");
  }

  equal(machine.getSnapshot().version, 0, "Version");
});

test("allows only valid reservation transitions", () => {
  equal(
    isValidReservationTransition("reserved", "checked_out"),
    true,
    "Checkout transition"
  );
  equal(
    isValidReservationTransition("reserved", "expired"),
    true,
    "Expiry transition"
  );
  equal(
    isValidReservationTransition("reserved", "reserved"),
    false,
    "Repeated transition"
  );
  equal(
    isValidReservationTransition("expired", "checked_out"),
    false,
    "Expired checkout"
  );
  equal(
    isValidReservationTransition("checked_out", "expired"),
    false,
    "Checkout expiry"
  );
});

test("supports zero initial stock", () => {
  const machine = new InventoryStateMachine(0);
  const result = machine.reserve(1, 0);

  assert(!result.success, "Cannot reserve from empty stock");

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    version: 0
  });
});

test("rejects invalid initial stock", () => {
  for (const stock of [-1, 1.5, NaN, Infinity]) {
    let threw = false;

    try {
      new InventoryStateMachine(stock);
    } catch (error) {
      threw = error instanceof RangeError;
    }

    assert(threw, `Expected RangeError for ${String(stock)}`);
  }
});

async function runTests(): Promise<void> {
  let passed = 0;

  for (const current of tests) {
    try {
      await current.run();
      passed += 1;
      console.log(`✔ ${current.name}`);
    } catch (error) {
      console.error(`✘ ${current.name}`);
      throw error;
    }
  }

  console.log(`\nTests passed: ${passed}/${tests.length}`);
}

void runTests();