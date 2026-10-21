import {
  InventoryStateMachine,
  isValidReservationTransition,
  type InventorySnapshot
} from "./inventory.js";

let passed = 0;

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

function test(name: string, run: () => void): void {
  run();
  passed += 1;
  console.log(`✔ ${name}`);
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

test("rejects invalid quantities without changing state", () => {
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

test("checkout moves reserved stock to sold", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(4, 0);

  assert(reservation.success, "Reservation should succeed");

  const result = machine.transitionReservation(
    reservation.data.id,
    "checked_out",
    reservation.inventory.version
  );

  assert(result.success, "Checkout should succeed");
  equal(result.inventory.version, 2, "Version after checkout");

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 10,
    available: 6,
    reserved: 0,
    sold: 4,
    version: 2
  });
});

test("expiry releases reserved stock exactly once", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(4, 0);

  assert(reservation.success, "Reservation should succeed");

  const result = machine.transitionReservation(
    reservation.data.id,
    "expired",
    reservation.inventory.version
  );

  assert(result.success, "Expiry should succeed");

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 10,
    available: 10,
    reserved: 0,
    sold: 0,
    version: 2
  });
});

test("rejects invalid and repeated transitions", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(2, 0);

  assert(reservation.success, "Reservation should succeed");

  const invalid = machine.transitionReservation(
    reservation.data.id,
    "reserved",
    reservation.inventory.version
  );

  assert(!invalid.success, "Repeated reserved state must fail");

  if (!invalid.success) {
    equal(invalid.error.code, "INVALID_TRANSITION", "Error code");
  }

  const expiry = machine.transitionReservation(
    reservation.data.id,
    "expired",
    machine.getSnapshot().version
  );

  assert(expiry.success, "Expiry should succeed");

  const before = machine.getSnapshot();
  const checkout = machine.transitionReservation(
    reservation.data.id,
    "checked_out",
    before.version
  );

  assert(!checkout.success, "Expired reservation cannot be checked out");
  assertSnapshot(machine.getSnapshot(), before);
});

test("rejects unknown reservation IDs", () => {
  const machine = new InventoryStateMachine(5);
  const result = machine.transitionReservation(
    "missing-reservation",
    "checked_out",
    0
  );

  assert(!result.success, "Unknown reservation must fail");

  if (!result.success) {
    equal(result.error.code, "RESERVATION_NOT_FOUND", "Error code");
  }

  equal(machine.getSnapshot().version, 0, "Version must not change");
});

test("allows only defined reservation transitions", () => {
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

  assert(!result.success, "Reservation with zero stock must fail");

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

test("stale reservation update changes nothing", () => {
  const machine = new InventoryStateMachine(5);
  const first = machine.reserve(1, 0);

  assert(first.success, "Initial reservation should succeed");

  const before = machine.getSnapshot();
  const stale = machine.reserve(1, 0);

  assert(!stale.success, "Stale reservation must fail");

  if (!stale.success) {
    equal(stale.error.code, "STALE_VERSION", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), before);
});

test("stale transition cannot change reservation or inventory", () => {
  const machine = new InventoryStateMachine(5);
  const reservation = machine.reserve(2, 0);

  assert(reservation.success, "Reservation should succeed");

  const before = machine.getSnapshot();
  const stale = machine.transitionReservation(
    reservation.data.id,
    "checked_out",
    0
  );

  assert(!stale.success, "Stale checkout must fail");

  if (!stale.success) {
    equal(stale.error.code, "STALE_VERSION", "Error code");
  }

  equal(
    machine.getReservation(reservation.data.id)?.status,
    "reserved",
    "Reservation must remain reserved"
  );

  assertSnapshot(machine.getSnapshot(), before);
});

test("two buyers using the same version cannot both reserve the last unit", () => {
  const machine = new InventoryStateMachine(1);
  const sharedVersion = machine.getSnapshot().version;

  const buyerA = machine.reserve(1, sharedVersion);
  const afterBuyerA = machine.getSnapshot();

  const buyerB = machine.reserve(1, sharedVersion);

  assert(buyerA.success, "First buyer should reserve the last unit");
  assert(!buyerB.success, "Second stale request must fail");

  if (!buyerB.success) {
    equal(buyerB.error.code, "STALE_VERSION", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), afterBuyerA);

  // Even with the refreshed version, no stock remains.
  const retry = machine.reserve(1, machine.getSnapshot().version);

  assert(!retry.success, "Second buyer must not oversell stock");

  if (!retry.success) {
    equal(retry.error.code, "INSUFFICIENT_STOCK", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 1,
    available: 0,
    reserved: 1,
    sold: 0,
    version: 1
  });
});

console.log(`\nTests passed: ${passed}/12`);