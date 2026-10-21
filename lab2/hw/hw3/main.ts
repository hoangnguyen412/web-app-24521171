import { createAntiDriftTimer } from "./anti-drift-timer.js";
import {
  InventoryStateMachine,
  type InventorySnapshot
} from "./inventory.js";

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

// The state machine is the single source of inventory quantities.
const inventoryStateMachine = new InventoryStateMachine(100);

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

function renderFlashSaleView(
  state: FlashSaleState,
  inventory: InventorySnapshot
): void {
  const { product } = state;

  const soldPercent = inventory.initialStock > 0
    ? (inventory.sold / inventory.initialStock) * 100
    : 0;

  getElement("product-price").textContent = formatVND(product.price);
  getElement("product-old-price").textContent =
    formatVND(product.originalPrice);
  getElement("product-discount").textContent =
    `-${product.discountPercent}%`;

  getElement("countdown").textContent =
    formatRemaining(state.countdownMs);

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

  getElement("reservation-status").textContent = state.reservationStatus;
  getElement("checkout-status").textContent = state.checkoutStatus;
}

renderFlashSaleView(
  flashSaleState,
  inventoryStateMachine.getSnapshot()
);

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