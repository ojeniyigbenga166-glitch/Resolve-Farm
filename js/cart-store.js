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
        quantity: Math.max(1, Math.floor(Number(line?.quantity) || 0)),
        packaging: String(line?.packaging || '')
      }))
      .filter((line) => line.id && line.quantity > 0 && getProductById(line.id));
  } catch (error) {
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

export function getItems() {
  return lines
    .map((line, index) => {
      const product = getProductById(line.id);
      if (!product) return null;
      const defaultPkg = product.packagingOptions?.[0]?.name || 'Standard Package';
      return {
        ...product,
        cartIndex: index,
        lineId: `${line.id}_${line.packaging || defaultPkg}`,
        quantity: line.quantity,
        packaging: line.packaging || defaultPkg
      };
    })
    .filter(Boolean);
}

export function getTotalItems() {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function isEmpty() {
  return lines.length === 0;
}

export function getQuantity(productId, packaging = '') {
  const line = lines.find((l) => l.id === productId && (!packaging || l.packaging === packaging));
  return line ? line.quantity : 0;
}

export function generateWhatsAppMessage() {
  const items = getItems();
  if (!items.length) return '';

  let message = `👋 Hello RESOLVEFARM! I would like to place an order inquiry:\n\n📋 *Order Details:*\n`;
  items.forEach((item, idx) => {
    message += `${idx + 1}. *${item.name}*\n   • Packaging: ${item.packaging}\n   • Quantity: ${item.quantity}\n`;
  });
  message += `\n📍 *Delivery / Pickup:* Canada\n`;
  message += `Please confirm product availability and total price to close the deal. Thank you!`;

  return encodeURIComponent(message);
}

/** Everything a subscriber needs, computed once. */
export function getState() {
  return {
    items: getItems(),
    totalItems: getTotalItems(),
    whatsAppUrl: `https://wa.me/15146297097?text=${generateWhatsAppMessage()}`,
    isEmpty: isEmpty()
  };
}

/* ---------------------------------------------------------------------------
   Mutations
   --------------------------------------------------------------------------- */

export function addItem(productId, quantity = 1, packaging = '') {
  const product = getProductById(productId);
  if (!product || !isPurchasable(product)) return 0;

  const selectedPkg = packaging || product.packagingOptions?.[0]?.name || 'Standard Package';
  const requested = Math.max(1, Math.floor(Number(quantity) || 1));
  const existing = lines.find((line) => line.id === productId && line.packaging === selectedPkg);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + requested, product.stock);
  } else {
    lines.push({ id: productId, quantity: requested, packaging: selectedPkg });
  }

  commit();
  return requested;
}

export function removeItem(indexOrId) {
  if (typeof indexOrId === 'number') {
    lines.splice(indexOrId, 1);
  } else {
    lines = lines.filter((line) => line.id !== indexOrId);
  }
  commit();
}

export function updateQuantity(index, quantity) {
  const next = Math.floor(Number(quantity) || 0);

  if (next <= 0) {
    removeItem(index);
    return;
  }

  if (lines[index]) {
    lines[index].quantity = next;
    commit();
  }
}

export function increaseQuantity(index) {
  if (lines[index]) {
    updateQuantity(index, lines[index].quantity + 1);
  }
}

export function decreaseQuantity(index) {
  if (lines[index]) {
    updateQuantity(index, lines[index].quantity - 1);
  }
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

window.addEventListener('storage', async (event) => {
  if (event.key !== STORAGE_KEY) return;
  await productsLoaded;
  lines = load();
  notify();
});

