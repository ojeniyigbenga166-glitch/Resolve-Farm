/**
 * RESOLVEFARM - Cart page controller
 *
 * A pure view over cart-store: it subscribes once and re-renders on every
 * mutation, so quantity changes, removals and cross-tab edits all land here
 * through the same path.
 */

import {
  decreaseQuantity,
  increaseQuantity,
  removeItem,
  clearCart,
  subscribe,
  FREE_DELIVERY_THRESHOLD
} from './cart-store.js';
import { getCategoryName } from './product-service.js';
import { escapeHtml, showToast } from './dom.js';
import { productUrl } from './product-card.js';

const el = {};

/* ---------------------------------------------------------------------------
   Rendering
   --------------------------------------------------------------------------- */

function renderLine(item) {
  const name = escapeHtml(item.name);
  const href = productUrl(item);
  const catName = escapeHtml(getCategoryName(item.category));

  return `
    <li class="cart-line" data-cart-line="${escapeHtml(item.id)}">
      <a class="cart-line-media" href="${href}" aria-label="View ${name}">
        <img src="${escapeHtml(item.image)}" alt="${name}" loading="lazy">
      </a>

      <div class="cart-line-info">
        <span class="cart-line-category">${catName}</span>
        <h3 class="cart-line-title"><a href="${href}">${name}</a></h3>
        <p class="cart-line-unit">Unit: ${escapeHtml(item.unit)}</p>
      </div>

      <p class="cart-line-total" style="display: none;"></p>
      <button type="button" class="cart-line-remove" data-cart-remove="${escapeHtml(item.id)}" aria-label="Remove ${name}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>

      <div class="cart-line-quantity">
        <button type="button" class="product-quantity-btn" data-cart-decrease="${escapeHtml(item.id)}" aria-label="Decrease quantity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span class="product-quantity-value">${item.quantity}</span>
        <button type="button" class="product-quantity-btn" data-cart-increase="${escapeHtml(item.id)}" aria-label="Increase quantity"${item.quantity >= item.stock ? ' disabled' : ''}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </li>
  `;
}

function renderFreeDeliveryMeter(state) {
  if (state.isEmpty) {
    el.deliveryMeter.hidden = true;
    return;
  }

  el.deliveryMeter.hidden = false;

  if (state.amountToFreeDelivery <= 0) {
    el.deliveryMeterText.innerHTML =
      '<strong>Free delivery unlocked.</strong> No delivery charge on this order.';
    el.deliveryMeterBar.style.width = '100%';
    el.deliveryMeter.classList.add('is-complete');
    return;
  }

  el.deliveryMeterText.innerHTML = `Spend <strong>${formatPrice(
    state.amountToFreeDelivery
  )}</strong> more for free delivery.`;
  el.deliveryMeterBar.style.width = `${Math.min(
    100,
    (state.subtotal / FREE_DELIVERY_THRESHOLD) * 100
  ).toFixed(1)}%`;
  el.deliveryMeter.classList.remove('is-complete');
}

function render(state) {
  const countText = state.totalItems === 1 ? '1 item' : `${state.totalItems} items`;
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = state.totalItems === 1 ? '1' : String(state.totalItems); });
  // Also update page band text separately (it uses "X items" wording)
  if (el.count) el.count.textContent = countText;

  el.empty.hidden = !state.isEmpty;
  el.layout.hidden = state.isEmpty;

  if (state.isEmpty) return;

  el.lines.innerHTML = state.items.map(renderLine).join('');

  if (el.subtotal) el.subtotal.textContent = '';
  if (el.delivery) el.delivery.textContent = '';
  if (el.total) el.total.textContent = '';

  // Free delivery meter hidden — re-enable by uncommenting the line below
  // renderFreeDeliveryMeter(state);
}

/* ---------------------------------------------------------------------------
   Events
   --------------------------------------------------------------------------- */

function bindEvents() {
  // Delegated, so the freshly re-rendered list never needs re-binding.
  el.lines.addEventListener('click', (event) => {
    const increase = event.target.closest('[data-cart-increase]');
    if (increase) {
      increaseQuantity(increase.dataset.cartIncrease);
      return;
    }

    const decrease = event.target.closest('[data-cart-decrease]');
    if (decrease) {
      decreaseQuantity(decrease.dataset.cartDecrease);
      return;
    }

    const remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      const line = remove.closest('.cart-line');
      const name = line?.querySelector('.cart-line-title')?.textContent?.trim();
      removeItem(remove.dataset.cartRemove);
      showToast(`${name || 'Item'} removed from cart`);
    }
  });

  el.clear.addEventListener('click', () => {
    // Destructive and not undoable - confirm before wiping the cart.
    if (!window.confirm('Remove everything from your cart?')) return;
    clearCart();
    showToast('Cart cleared');
  });
}

/* ---------------------------------------------------------------------------
   Init
   --------------------------------------------------------------------------- */

function init() {
  el.layout = document.querySelector('[data-cart-layout]');
  if (!el.layout) return;

  el.lines = document.querySelector('[data-cart-lines]');
  el.empty = document.querySelector('[data-cart-empty]');
  el.count = document.querySelector('[data-cart-count]');
  el.subtotal = document.querySelector('[data-cart-subtotal]');
  el.delivery = document.querySelector('[data-cart-delivery]');
  el.total = document.querySelector('[data-cart-total]');
  el.clear = document.querySelector('[data-cart-clear]');
  el.deliveryMeter = document.querySelector('[data-cart-delivery-meter]');
  el.deliveryMeterText = document.querySelector('[data-cart-delivery-text]');
  el.deliveryMeterBar = document.querySelector('[data-cart-delivery-bar]');

  bindEvents();
  subscribe(render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
