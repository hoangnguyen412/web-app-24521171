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

test("reservation moves stock to reserved", () => {
  const machine = new InventoryStateMachine(10);
  const result = machine.reserve(4);

  assert(result.success, "Reservation should succeed");
  equal(result.data.quantity, 4, "Quantity");
  equal(result.data.status, "reserved", "Status");

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 10,
    available: 6,
    reserved: 4,
    sold: 0,
    version: 1
  });
});

test("rejects invalid quantities", () => {
  const machine = new InventoryStateMachine(10);
  const initial = machine.getSnapshot();

  for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
    const result = machine.reserve(quantity);

    assert(!result.success, "Invalid quantity must fail");

    if (!result.success) {
      equal(result.error.code, "INVALID_QUANTITY", "Error code");
    }

    assertSnapshot(machine.getSnapshot(), initial);
  }
});

test("rejects reservation exceeding available stock", () => {
  const machine = new InventoryStateMachine(3);
  assert(machine.reserve(3).success, "Initial reservation should succeed");

  const before = machine.getSnapshot();
  const result = machine.reserve(1);

  assert(!result.success, "Overselling must be rejected");

  if (!result.success) {
    equal(result.error.code, "INSUFFICIENT_STOCK", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), before);
});

test("checkout moves reserved stock to sold", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(4);

  assert(reservation.success, "Reservation should succeed");

  const result = machine.transitionReservation(
    reservation.data.id,
    "checked_out"
  );

  assert(result.success, "Checkout should succeed");

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 10,
    available: 6,
    reserved: 0,
    sold: 4,
    version: 2
  });
});

test("expiry releases stock back to available", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(4);

  assert(reservation.success, "Reservation should succeed");

  const result = machine.transitionReservation(
    reservation.data.id,
    "expired"
  );

  assert(result.success, "Expiry should succeed");
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

test("rejects invalid and repeated transitions", () => {
  const machine = new InventoryStateMachine(10);
  const reservation = machine.reserve(2);

  assert(reservation.success, "Reservation should succeed");

  const before = machine.getSnapshot();
  const invalid = machine.transitionReservation(
    reservation.data.id,
    "reserved"
  );

  assert(!invalid.success, "Repeated reserved status must fail");
  assertSnapshot(machine.getSnapshot(), before);

  const expiry = machine.transitionReservation(
    reservation.data.id,
    "expired"
  );

  assert(expiry.success, "Expiry should succeed");

  const afterExpiry = machine.getSnapshot();
  const checkout = machine.transitionReservation(
    reservation.data.id,
    "checked_out"
  );

  assert(!checkout.success, "Expired reservation cannot be checked out");
  assertSnapshot(machine.getSnapshot(), afterExpiry);
});

test("rejects unknown reservation IDs", () => {
  const machine = new InventoryStateMachine(5);
  const result = machine.transitionReservation(
    "missing-reservation",
    "checked_out"
  );

  assert(!result.success, "Unknown reservation must fail");

  if (!result.success) {
    equal(result.error.code, "RESERVATION_NOT_FOUND", "Error code");
  }

  assertSnapshot(machine.getSnapshot(), {
    initialStock: 5,
    available: 5,
    reserved: 0,
    sold: 0,
    version: 0
  });
});

test("allows only defined reservation transitions", () => {
  equal(isValidReservationTransition("reserved", "checked_out"), true, "Checkout transition");
  equal(isValidReservationTransition("reserved", "expired"), true, "Expiry transition");
  equal(isValidReservationTransition("reserved", "reserved"), false, "Repeated state");
  equal(isValidReservationTransition("expired", "checked_out"), false, "Expired checkout");
  equal(isValidReservationTransition("checked_out", "expired"), false, "Checkout expiry");
});

test("supports zero initial stock", () => {
  const machine = new InventoryStateMachine(0);

  assert(!machine.reserve(1).success, "Cannot reserve zero stock");

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

console.log(`\nTests passed: ${passed}/10`);