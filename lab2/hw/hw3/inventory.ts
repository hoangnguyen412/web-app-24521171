export type ReservationStatus = "reserved" | "checked_out" | "expired";

export interface InventorySnapshot {
  readonly initialStock: number;
  readonly available: number;
  readonly reserved: number;
  readonly sold: number;
  readonly version: number;
}

export interface ReservationSnapshot {
  readonly id: string;
  readonly quantity: number;
  readonly status: ReservationStatus;
}

export type InventoryErrorCode =
  | "INVALID_QUANTITY"
  | "INSUFFICIENT_STOCK"
  | "RESERVATION_NOT_FOUND"
  | "INVALID_TRANSITION";

export type InventoryResult<T> =
  | {
      readonly success: true;
      readonly data: T;
      readonly inventory: InventorySnapshot;
    }
  | {
      readonly success: false;
      readonly error: {
        readonly code: InventoryErrorCode;
        readonly message: string;
      };
      readonly inventory: InventorySnapshot;
    };

interface MutableInventory {
  initialStock: number;
  available: number;
  reserved: number;
  sold: number;
  version: number;
}

interface MutableReservation {
  id: string;
  quantity: number;
  status: ReservationStatus;
}

const VALID_TRANSITIONS: Record<
  ReservationStatus,
  readonly ReservationStatus[]
> = {
  reserved: ["checked_out", "expired"],
  checked_out: [],
  expired: []
};

export function isValidReservationTransition(
  from: ReservationStatus,
  to: ReservationStatus
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export class InventoryStateMachine {
  private readonly inventory: MutableInventory;
  private readonly reservations = new Map<string, MutableReservation>();
  private nextReservationId = 1;

  constructor(initialStock: number) {
    if (!Number.isSafeInteger(initialStock) || initialStock < 0) {
      throw new RangeError("initialStock must be a non-negative integer");
    }

    this.inventory = {
      initialStock,
      available: initialStock,
      reserved: 0,
      sold: 0,
      version: 0
    };

    this.assertInvariants();
  }

  getSnapshot(): InventorySnapshot {
    return { ...this.inventory };
  }

  getReservation(id: string): ReservationSnapshot | undefined {
    const reservation = this.reservations.get(id);
    return reservation ? { ...reservation } : undefined;
  }

  reserve(quantity: number): InventoryResult<ReservationSnapshot> {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      return this.failure(
        "INVALID_QUANTITY",
        "Quantity must be a positive integer"
      );
    }

    if (quantity > this.inventory.available) {
      return this.failure(
        "INSUFFICIENT_STOCK",
        "Not enough available stock"
      );
    }

    const reservation: MutableReservation = {
      id: `reservation-${this.nextReservationId}`,
      quantity,
      status: "reserved"
    };

    this.inventory.available -= quantity;
    this.inventory.reserved += quantity;
    this.inventory.version += 1;

    this.reservations.set(reservation.id, reservation);
    this.nextReservationId += 1;

    this.assertInvariants();
    return this.success({ ...reservation });
  }

  transitionReservation(
    id: string,
    nextStatus: ReservationStatus
  ): InventoryResult<ReservationSnapshot> {
    const reservation = this.reservations.get(id);

    if (!reservation) {
      return this.failure(
        "RESERVATION_NOT_FOUND",
        `Reservation "${id}" does not exist`
      );
    }

    if (!isValidReservationTransition(reservation.status, nextStatus)) {
      return this.failure(
        "INVALID_TRANSITION",
        `Cannot transition from "${reservation.status}" to "${nextStatus}"`
      );
    }

    if (nextStatus === "checked_out") {
      this.inventory.reserved -= reservation.quantity;
      this.inventory.sold += reservation.quantity;
    } else {
      // Expiry releases the reserved stock exactly once.
      this.inventory.reserved -= reservation.quantity;
      this.inventory.available += reservation.quantity;
    }

    reservation.status = nextStatus;
    this.inventory.version += 1;

    this.assertInvariants();
    return this.success({ ...reservation });
  }

  private success<T>(data: T): InventoryResult<T> {
    return {
      success: true,
      data,
      inventory: this.getSnapshot()
    };
  }

  private failure(
    code: InventoryErrorCode,
    message: string
  ): InventoryResult<never> {
    return {
      success: false,
      error: { code, message },
      inventory: this.getSnapshot()
    };
  }

  private assertInvariants(): void {
    const { initialStock, available, reserved, sold, version } =
      this.inventory;

    const values = [initialStock, available, reserved, sold, version];

    if (
      !values.every(Number.isSafeInteger) ||
      values.some((value) => value < 0)
    ) {
      throw new Error("Inventory invariant violated: invalid values");
    }

    if (available + reserved + sold !== initialStock) {
      throw new Error("Inventory invariant violated: stock total mismatch");
    }

    let activeReserved = 0;
    let completedSold = 0;

    for (const reservation of this.reservations.values()) {
      if (
        !Number.isSafeInteger(reservation.quantity) ||
        reservation.quantity <= 0
      ) {
        throw new Error("Inventory invariant violated: invalid reservation");
      }

      if (reservation.status === "reserved") {
        activeReserved += reservation.quantity;
      } else if (reservation.status === "checked_out") {
        completedSold += reservation.quantity;
      }
    }

    if (activeReserved !== reserved || completedSold !== sold) {
      throw new Error(
        "Inventory invariant violated: reservation totals mismatch"
      );
    }
  }
}