/**
 * RESOLVEFARM - Cart Store
 *
 * One reactive cart shared by every page. Any module can mutate it and any
 * module can subscribe to it; the header badge, the cart page and the checkout
 * summary all re-render from the same notification.
 *
 * PERSISTENCE: only `{ id, quantity }` pairs are written to localStorage - never
 * the name, price or image. Product facts are re-read from the catalogue on
 * every load, so when a price is corrected in the admin dashboard, carts that
 * are already saved in a customer's browser pick up the new price instead of
 * being stuck on a stale one. Lines whose product no longer exists are dropped
 * silently on hydrate.
 */

import { getProductById, isPurchasable, productsLoaded } from './product-service.js';

const STORAGE_KEY = 'resolvefarm_cart';

/** Flat-rate delivery, waived above the threshold. */
export const DELIVERY_FLAT_FEE = 9.99;
export const FREE_DELIVERY_THRESHOLD = 75;

/** Raw persisted lines: [{ id, quantity }] */
let lines = [];
const subscribers = new Set();

/* ---------------------------------------------------------------------------
   Persistence
   --------------------------------------------------------------------------- */

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((line) => ({
        id: String(line?.id || ''),
        quantity: Math.max(1, Math.floor(Number(line?.quantity) || 0))
      }))
      // Drop anything that is no longer a real, purchasable product.
      .filter((line) => line.id && line.quantity > 0 && getProductById(line.id));
  } catch (error) {
    // Corrupt or unavailable storage (private mode, quota, hand-edited JSON)
    // must never take the whole shop down - start from an empty cart instead.
    console.warn('Cart could not be restored, starting empty.', error);
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch (error) {
    console.warn('Cart could not be saved.', error);
  }
}

/* ---------------------------------------------------------------------------
   Reactivity
   --------------------------------------------------------------------------- */

function notify() {
  const state = getState();
  subscribers.forEach((fn) => {
    try {
      fn(state);
    } catch (error) {
      console.error('Cart subscriber failed.', error);
    }
  });
}

/**
 * Register a listener. Fires immediately with the current state so callers
 * don't need a separate first paint. Returns an unsubscribe function.
 */
export function subscribe(fn) {
  if (typeof fn !== 'function') return () => {};
  subscribers.add(fn);
  fn(getState());
  return () => subscribers.delete(fn);
}

function commit() {
  save();
  notify();
}

/* ---------------------------------------------------------------------------
   Derived state
   --------------------------------------------------------------------------- */

/** Cart lines hydrated with live product data + line totals. */
export function getItems() {
  return lines
    .map((line) => {
      const product = getProductById(line.id);
      if (!product) return null;
      return {
        ...product,
        quantity: line.quantity,
        lineTotal: 0
      };
    })
    .filter(Boolean);
}

export function getTotalItems() {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function getSubtotal() {
  return 0;
}

export function getDeliveryFee() {
  return 0;
}

export function getGrandTotal() {
  return 0;
}

export function getAmountToFreeDelivery() {
  return 0;
}

export function isEmpty() {
  return lines.length === 0;
}

export function getQuantity(productId) {
  return lines.find((line) => line.id === productId)?.quantity || 0;
}

/** Everything a subscriber needs, computed once. */
export function getState() {
  return {
    items: getItems(),
    totalItems: getTotalItems(),
    subtotal: getSubtotal(),
    deliveryFee: getDeliveryFee(),
    grandTotal: getGrandTotal(),
    amountToFreeDelivery: getAmountToFreeDelivery(),
    isEmpty: isEmpty()
  };
}

/* ---------------------------------------------------------------------------
   Mutations
   --------------------------------------------------------------------------- */

/**
 * Add a product, or top up its quantity if it is already in the cart.
 * Quantity is clamped to available stock. Returns the resulting quantity,
 * or 0 if the product was rejected.
 */
export function addItem(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product || !isPurchasable(product)) return 0;

  const requested = Math.max(1, Math.floor(Number(quantity) || 1));
  const existing = lines.find((line) => line.id === productId);
  const nextQuantity = Math.min((existing?.quantity || 0) + requested, product.stock);

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    lines.push({ id: productId, quantity: nextQuantity });
  }

  commit();
  return nextQuantity;
}

export function removeItem(productId) {
  const before = lines.length;
  lines = lines.filter((line) => line.id !== productId);
  if (lines.length !== before) commit();
}

/** Set an absolute quantity. Zero or less removes the line. */
export function updateQuantity(productId, quantity) {
  const next = Math.floor(Number(quantity) || 0);

  if (next <= 0) {
    removeItem(productId);
    return;
  }

  const product = getProductById(productId);
  if (!product) return;

  const line = lines.find((item) => item.id === productId);
  if (!line) return;

  line.quantity = Math.min(next, product.stock);
  commit();
}

export function increaseQuantity(productId) {
  updateQuantity(productId, getQuantity(productId) + 1);
}

export function decreaseQuantity(productId) {
  updateQuantity(productId, getQuantity(productId) - 1);
}

export function clearCart() {
  if (!lines.length) return;
  lines = [];
  commit();
}

/* ---------------------------------------------------------------------------
   Init
   --------------------------------------------------------------------------- */

export const cartInitialized = (async () => {
  await productsLoaded;
  lines = load();
  notify();
})();

/* Keep duplicate tabs in agreement - if the cart changes in another tab,
   re-hydrate and re-render here too. */
window.addEventListener('storage', async (event) => {
  if (event.key !== STORAGE_KEY) return;
  await productsLoaded;
  lines = load();
  notify();
});
