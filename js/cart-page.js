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
  generateWhatsAppMessage
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
  const pkg = escapeHtml(item.packaging);

  return `
    <li class="cart-line" data-cart-index="${item.cartIndex}">
      <a class="cart-line-media" href="${href}" aria-label="View ${name}">
        <img src="${escapeHtml(item.image)}" alt="${name}" loading="lazy">
      </a>

      <div class="cart-line-info">
        <span class="cart-line-category">${catName}</span>
        <h3 class="cart-line-title"><a href="${href}">${name}</a></h3>
        <p class="cart-line-unit"><strong>Packaging:</strong> ${pkg}</p>
      </div>

      <button type="button" class="cart-line-remove" data-cart-remove="${item.cartIndex}" aria-label="Remove ${name}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>

      <div class="cart-line-quantity">
        <button type="button" class="product-quantity-btn" data-cart-decrease="${item.cartIndex}" aria-label="Decrease quantity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span class="product-quantity-value">${item.quantity}</span>
        <button type="button" class="product-quantity-btn" data-cart-increase="${item.cartIndex}" aria-label="Increase quantity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </li>
  `;
}

function render(state) {
  const countText = state.totalItems === 1 ? '1 item' : `${state.totalItems} items`;
  document.querySelectorAll('[data-cart-count]').forEach(e => { e.textContent = String(state.totalItems); });
  if (el.count) el.count.textContent = countText;

  el.empty.hidden = !state.isEmpty;
  el.layout.hidden = state.isEmpty;

  if (state.isEmpty) return;

  el.lines.innerHTML = state.items.map(renderLine).join('');

  if (el.whatsAppBtn) {
    el.whatsAppBtn.href = state.whatsAppUrl;
  }
}

/* ---------------------------------------------------------------------------
   Events
   --------------------------------------------------------------------------- */

function bindEvents() {
  el.lines.addEventListener('click', (event) => {
    const increase = event.target.closest('[data-cart-increase]');
    if (increase) {
      increaseQuantity(parseInt(increase.dataset.cartIncrease, 10));
      return;
    }

    const decrease = event.target.closest('[data-cart-decrease]');
    if (decrease) {
      decreaseQuantity(parseInt(decrease.dataset.cartDecrease, 10));
      return;
    }

    const remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      const idx = parseInt(remove.dataset.cartRemove, 10);
      removeItem(idx);
      showToast(`Item removed from order list`);
    }
  });

  if (el.clear) {
    el.clear.addEventListener('click', () => {
      if (!window.confirm('Clear all items from your order list?')) return;
      clearCart();
      showToast('Order list cleared');
    });
  }
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
  el.clear = document.querySelector('[data-cart-clear]');
  el.whatsAppBtn = document.querySelector('[data-cart-whatsapp-btn]');

  bindEvents();
  subscribe(render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

