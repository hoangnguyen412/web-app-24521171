import {
  InventoryStateMachine,
  type InventoryResult,
  type ReservationSnapshot
} from "./inventory.js";

export class CheckoutService {
  constructor(private readonly inventory: InventoryStateMachine) {}

  checkout(
    reservationId: string,
    expectedVersion: number
  ): InventoryResult<ReservationSnapshot> {
    return this.inventory.checkout(reservationId, expectedVersion);
  }
}