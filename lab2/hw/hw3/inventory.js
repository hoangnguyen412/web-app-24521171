const VALID_TRANSITIONS = {
    reserved: ["checked_out", "expired"],
    checked_out: [],
    expired: []
};
export const DEFAULT_RESERVATION_LOCK_MS = 15000;
const MAX_TIMEOUT_MS = 2147483647;
export function isValidReservationTransition(from, to) {
    return VALID_TRANSITIONS[from].includes(to);
}
export class InventoryStateMachine {
    constructor(initialStock) {
        this.reservations = new Map();
        this.expiryTimers = new Map();
        this.listeners = new Set();
        this.nextReservationId = 1;
        if (!Number.isSafeInteger(initialStock) || initialStock < 0) {
            throw new RangeError("initialStock must be a non-negative safe integer");
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
    getSnapshot() {
        return { ...this.inventory };
    }
    getReservation(id) {
        const reservation = this.reservations.get(id);
        return reservation ? { ...reservation } : undefined;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.getSnapshot());
        return () => {
            this.listeners.delete(listener);
        };
    }
    reserve(quantity, expectedVersion, lockDurationMs = DEFAULT_RESERVATION_LOCK_MS) {
        const versionError = this.checkVersion(expectedVersion);
        if (versionError) {
            return versionError;
        }
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return this.failure("INVALID_QUANTITY", "Quantity must be a positive safe integer");
        }
        if (!Number.isSafeInteger(lockDurationMs) ||
            lockDurationMs <= 0 ||
            lockDurationMs > MAX_TIMEOUT_MS) {
            return this.failure("INVALID_LOCK_DURATION", "Lock duration must be a positive integer within the timer limit");
        }
        if (quantity > this.inventory.available) {
            return this.failure("INSUFFICIENT_STOCK", "Not enough available stock");
        }
        const reservation = {
            id: `reservation-${this.nextReservationId}`,
            quantity,
            status: "reserved",
            expiresAt: Date.now() + lockDurationMs
        };
        this.inventory.available -= quantity;
        this.inventory.reserved += quantity;
        this.inventory.version += 1;
        this.reservations.set(reservation.id, reservation);
        this.nextReservationId += 1;
        this.assertInvariants();
        this.scheduleExpiry(reservation);
        this.notifyListeners();
        return this.success({ ...reservation });
    }
    checkout(id, expectedVersion) {
        return this.transitionReservation(id, "checked_out", expectedVersion);
    }
    expireReservation(id, expectedVersion) {
        return this.transitionReservation(id, "expired", expectedVersion);
    }
    transitionReservation(id, nextStatus, expectedVersion) {
        const versionError = this.checkVersion(expectedVersion);
        if (versionError) {
            return versionError;
        }
        const reservation = this.reservations.get(id);
        if (!reservation) {
            return this.failure("RESERVATION_NOT_FOUND", `Reservation "${id}" does not exist`);
        }
        if (nextStatus === "checked_out" &&
            reservation.status === "expired") {
            return this.failure("RESERVATION_EXPIRED", "An expired reservation cannot be checked out");
        }
        if (reservation.status === "reserved" &&
            nextStatus === "checked_out" &&
            Date.now() >= reservation.expiresAt) {
            // Enforce expiry even if the scheduled timeout has not run yet.
            this.finalizeExpiry(reservation);
            return this.failure("RESERVATION_EXPIRED", "The reservation expired before checkout");
        }
        if (reservation.status === "reserved" &&
            nextStatus === "expired" &&
            Date.now() < reservation.expiresAt) {
            return this.failure("LOCK_NOT_EXPIRED", "The reservation lock has not expired yet");
        }
        if (!isValidReservationTransition(reservation.status, nextStatus)) {
            return this.failure("INVALID_TRANSITION", `Cannot transition from "${reservation.status}" to "${nextStatus}"`);
        }
        if (nextStatus === "checked_out") {
            this.clearExpiryTimer(id);
            this.inventory.reserved -= reservation.quantity;
            this.inventory.sold += reservation.quantity;
            reservation.status = "checked_out";
            this.inventory.version += 1;
            this.assertInvariants();
            this.notifyListeners();
            return this.success({ ...reservation });
        }
        this.finalizeExpiry(reservation);
        return this.success({ ...reservation });
    }
    scheduleExpiry(reservation) {
        this.clearExpiryTimer(reservation.id);
        const delay = Math.max(0, reservation.expiresAt - Date.now());
        const timer = setTimeout(() => {
            this.expiryTimers.delete(reservation.id);
            this.handleExpiryTimer(reservation.id);
        }, delay);
        // Avoid keeping a Node.js test process alive solely for a lock timer.
        // Browsers use numeric timer IDs and simply skip this optional method.
        const nodeTimer = timer;
        nodeTimer.unref?.();
        this.expiryTimers.set(reservation.id, timer);
    }
    handleExpiryTimer(id) {
        const reservation = this.reservations.get(id);
        if (!reservation || reservation.status !== "reserved") {
            return;
        }
        // Re-check the deadline rather than trusting the timer's firing time.
        if (Date.now() < reservation.expiresAt) {
            this.scheduleExpiry(reservation);
            return;
        }
        this.finalizeExpiry(reservation);
    }
    finalizeExpiry(reservation) {
        if (reservation.status !== "reserved") {
            return;
        }
        this.clearExpiryTimer(reservation.id);
        this.inventory.reserved -= reservation.quantity;
        this.inventory.available += reservation.quantity;
        reservation.status = "expired";
        this.inventory.version += 1;
        this.assertInvariants();
        this.notifyListeners();
    }
    clearExpiryTimer(id) {
        const timer = this.expiryTimers.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.expiryTimers.delete(id);
        }
    }
    checkVersion(expectedVersion) {
        if (expectedVersion !== this.inventory.version) {
            return this.failure("STALE_VERSION", `Expected version ${expectedVersion}, current version is ${this.inventory.version}`);
        }
        return null;
    }
    notifyListeners() {
        const snapshot = this.getSnapshot();
        for (const listener of this.listeners) {
            listener(snapshot);
        }
    }
    success(data) {
        return {
            success: true,
            data,
            inventory: this.getSnapshot()
        };
    }
    failure(code, message) {
        return {
            success: false,
            error: { code, message },
            inventory: this.getSnapshot()
        };
    }
    assertInvariants() {
        const { initialStock, available, reserved, sold, version } = this.inventory;
        const values = [initialStock, available, reserved, sold, version];
        if (!values.every(Number.isSafeInteger) ||
            values.some((value) => value < 0)) {
            throw new Error("Inventory invariant violated: invalid values");
        }
        if (available + reserved + sold !== initialStock) {
            throw new Error("Inventory invariant violated: stock total mismatch");
        }
        let activeReserved = 0;
        let completedSold = 0;
        for (const reservation of this.reservations.values()) {
            if (!Number.isSafeInteger(reservation.quantity) ||
                reservation.quantity <= 0) {
                throw new Error("Inventory invariant violated: invalid reservation");
            }
            if (reservation.status === "reserved") {
                activeReserved += reservation.quantity;
            }
            else if (reservation.status === "checked_out") {
                completedSold += reservation.quantity;
            }
        }
        if (activeReserved !== reserved || completedSold !== sold) {
            throw new Error("Inventory invariant violated: reservation totals mismatch");
        }
    }
}
