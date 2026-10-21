import { createAntiDriftTimer } from "./anti-drift-timer.js";
import {
  InventoryStateMachine,
  type InventorySnapshot
} from "./inventory.js";
import { CheckoutService } from "./checkout.js";

const LOCK_DURATION_MS = 15_000;
const DEMO_LOCK_DURATION_MS = 60 * 60 * 1000;

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

// The sale deadline prevents new reservations after the countdown.
const saleDeadline = Date.now() + flashSaleState.countdownMs;
let saleEnded = false;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate demo quantities on each page load.
const demoAvailable = randomInt(30, 70);
const demoReserved = randomInt(5, 20);
const demoSold = randomInt(3, 15);

const initialStock = demoAvailable + demoReserved + demoSold;

// InventoryStateMachine is the single source of stock quantities.
const inventory = new InventoryStateMachine(initialStock);
const checkoutService = new CheckoutService(inventory);

// Seed active reserved stock through real state transitions.
const demoReservation = inventory.reserve(
  demoReserved,
  inventory.getSnapshot().version,
  DEMO_LOCK_DURATION_MS
);

if (!demoReservation.success) {
  throw new Error(demoReservation.error.message);
}

// Seed sold stock through a real reservation and checkout.
const demoSale = inventory.reserve(
  demoSold,
  inventory.getSnapshot().version,
  DEMO_LOCK_DURATION_MS
);

if (!demoSale.success) {
  throw new Error(demoSale.error.message);
}

const demoCheckout = checkoutService.checkout(
  demoSale.data.id,
  inventory.getSnapshot().version
);

if (!demoCheckout.success) {
  throw new Error(demoCheckout.error.message);
}

let activeReservationId: string | null = null;

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing UI element: #${id}`);
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

  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}.` +
    `${String(milliseconds).padStart(3, "0")}`
  );
}

function renderFlashSaleView(snapshot: InventorySnapshot): void {
  const { product } = flashSaleState;

  getElement("product-price").textContent = formatVND(product.price);
  getElement("product-old-price").textContent =
    formatVND(product.originalPrice);
  getElement("product-discount").textContent =
    `-${product.discountPercent}%`;

  getElement("version").textContent = `VERSION ${snapshot.version}`;

  getElement("stock-summary").textContent =
    `${snapshot.available} / ${snapshot.initialStock} sản phẩm còn có thể giữ`;

  getElement("available-stock").textContent =
    String(snapshot.available);
  getElement("reserved-stock").textContent =
    String(snapshot.reserved);
  getElement("sold-stock").textContent =
    String(snapshot.sold);

  const soldPercent = snapshot.initialStock > 0
    ? (snapshot.sold / snapshot.initialStock) * 100
    : 0;

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
  // Also check the deadline here in case a background tab delayed a frame.
  if (Date.now() >= saleDeadline) {
    saleEnded = true;
  }

  const snapshot = inventory.getSnapshot();

  const reservation = activeReservationId
    ? inventory.getReservation(activeReservationId)
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
  } else if (saleEnded) {
    flashSaleState.reservationStatus = "Flash sale đã kết thúc";
  }

  // Block new reservations once the sale ends.
  reserveButton.disabled =
    saleEnded ||
    snapshot.available === 0 ||
    reservation?.status === "reserved";

  // An existing reservation can still be checked out while its lock is valid.
  checkoutButton.disabled = reservation?.status !== "reserved";

  renderFlashSaleView(snapshot);
}

// Refresh the UI when reservations expire or inventory changes.
inventory.subscribe(() => refreshView());

reserveButton.addEventListener("click", () => {
  // Enforce the deadline in the event handler too, not only in the UI.
  if (saleEnded || Date.now() >= saleDeadline) {
    saleEnded = true;
    refreshView();
    return;
  }

  const result = inventory.reserve(
    1,
    inventory.getSnapshot().version,
    LOCK_DURATION_MS
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
    inventory.getSnapshot().version
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

const cancelTimer = createAntiDriftTimer(
  flashSaleState.countdownMs,
  (remaining) => {
    countdownElement.textContent = formatRemaining(remaining);

    if (remaining === 0) {
      saleEnded = true;

      if (timerLabel) {
        timerLabel.textContent = "Ưu đãi đã kết thúc";
      }

      refreshView();
    }
  }
);

window.addEventListener("pagehide", cancelTimer, { once: true });

// Render the initial state.
refreshView();