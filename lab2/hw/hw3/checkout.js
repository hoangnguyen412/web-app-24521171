export class CheckoutService {
    constructor(inventory) {
        this.inventory = inventory;
    }
    checkout(reservationId, expectedVersion) {
        return this.inventory.checkout(reservationId, expectedVersion);
    }
}
