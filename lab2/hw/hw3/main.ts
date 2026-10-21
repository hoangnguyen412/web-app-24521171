import { createAntiDriftTimer } from "./anti-drift-timer.js";
import { InventoryStateMachine, type InventorySnapshot } from "./inventory.js";
import { CheckoutService } from "./checkout.js";

interface Product {
  price: number;
  originalPrice: number;
  discountPercent: number;
}

interface FlashSaleState {
  product: Product;
  countdownMs: number;
  reservationStatus: string;
  checkoutStatus: string;
}

const flashSaleState: FlashSaleState = {
  product: {
    price: 1290000,
    originalPrice: 1990000,
    discountPercent: 35
  },
  countdownMs: 600000,
  reservationStatus: "Chưa giữ hàng",
  checkoutStatus: "Chưa thanh toán"
};

const inventoryStateMachine = new InventoryStateMachine(100);
const checkoutService = new CheckoutService(inventoryStateMachine);

let activeReservationId: string | null = null;

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required UI element: #${id}`);
  }

  return element;
}

function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

function formatRemaining(ms: number): string {
  const safeMs = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const milliseconds = safeMs % 1000;

  return [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":") + "." + String(milliseconds).padStart(3, "0");
}

function renderFlashSaleView(inventory: InventorySnapshot): void {
  const { product } = flashSaleState;

  const soldPercent = inventory.initialStock > 0
    ? (inventory.sold / inventory.initialStock) * 100
    : 0;

  getElement("product-price").textContent = formatVND(product.price);
  getElement("product-old-price").textContent =
    formatVND(product.originalPrice);
  getElement("product-discount").textContent =
    `-${product.discountPercent}%`;

  getElement("version").textContent = `VERSION ${inventory.version}`;
  getElement("stock-summary").textContent =
    `${inventory.available} / ${inventory.initialStock} sản phẩm còn có thể giữ`;

  getElement("available-stock").textContent = String(inventory.available);
  getElement("reserved-stock").textContent = String(inventory.reserved);
  getElement("sold-stock").textContent = String(inventory.sold);

  getElement("stock-progress-fill").style.width =
    `${Math.min(100, Math.max(0, soldPercent))}%`;

  getElement("stock-progress").setAttribute(
    "aria-valuenow",
    String(Math.round(soldPercent))
  );

  getElement("reservation-status").textContent =
    flashSaleState.reservationStatus;
  getElement("checkout-status").textContent =
    flashSaleState.checkoutStatus;
}

const reserveButton = getElement("reserve-button") as HTMLButtonElement;
const checkoutButton = getElement("checkout-button") as HTMLButtonElement;

function refreshView(): void {
  const inventory = inventoryStateMachine.getSnapshot();
  const reservation = activeReservationId
    ? inventoryStateMachine.getReservation(activeReservationId)
    : undefined;

  if (reservation?.status === "reserved") {
    flashSaleState.reservationStatus = "Đang giữ hàng";
    flashSaleState.checkoutStatus = "Chưa thanh toán";
  } else if (reservation?.status === "expired") {
    flashSaleState.reservationStatus = "Đã hết hạn";
    flashSaleState.checkoutStatus = "Không thể thanh toán: hết hạn";
  } else if (reservation?.status === "checked_out") {
    flashSaleState.reservationStatus = "Đã xác nhận đơn";
    flashSaleState.checkoutStatus = "Thanh toán thành công";
  }

  reserveButton.disabled =
    inventory.available === 0 || reservation?.status === "reserved";

  checkoutButton.disabled = reservation?.status !== "reserved";

  renderFlashSaleView(inventory);
}

// Refresh the UI after reservation, checkout, or automatic expiry.
inventoryStateMachine.subscribe(() => refreshView());

reserveButton.addEventListener("click", () => {
  const result = inventoryStateMachine.reserve(
    1,
    inventoryStateMachine.getSnapshot().version
  );

  if (!result.success) {
    flashSaleState.reservationStatus = result.error.message;
    refreshView();
    return;
  }

  activeReservationId = result.data.id;
  flashSaleState.reservationStatus = "Đang giữ hàng";
  flashSaleState.checkoutStatus = "Chưa thanh toán";

  refreshView();
});

checkoutButton.addEventListener("click", () => {
  if (!activeReservationId) {
    return;
  }

  const result = checkoutService.checkout(
    activeReservationId,
    inventoryStateMachine.getSnapshot().version
  );

  if (!result.success) {
    flashSaleState.checkoutStatus =
      result.error.code === "RESERVATION_EXPIRED"
        ? "Không thể thanh toán: hết hạn"
        : `Thanh toán thất bại: ${result.error.message}`;
  }

  refreshView();
});

const countdownElement = getElement("countdown");
const timerLabel = document.querySelector<HTMLElement>(".timer-label");

const cancelFlashSaleTimer = createAntiDriftTimer(
  flashSaleState.countdownMs,
  (remaining) => {
    countdownElement.textContent = formatRemaining(remaining);

    if (remaining === 0 && timerLabel) {
      timerLabel.textContent = "Ưu đãi đã kết thúc";
    }
  }
);

window.addEventListener("pagehide", cancelFlashSaleTimer, { once: true });