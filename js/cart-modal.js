/**
 * RESOLVEFARM - Cart Modal Controller
 *
 * Implements a Jumia-style popup overlay confirming item additions,
 * showing cart summaries, delivery progress meters, and quick checkouts.
 */

import { getState, FREE_DELIVERY_THRESHOLD } from './cart-store.js';
import { formatPrice, getCategoryName } from './product-service.js';
import { escapeHtml } from './dom.js';

let overlayEl = null;

function ensureModalCreated() {
  if (overlayEl) return;

  overlayEl = document.createElement('div');
  overlayEl.className = 'cart-modal-overlay';
  overlayEl.setAttribute('aria-modal', 'true');
  overlayEl.setAttribute('role', 'dialog');
  overlayEl.hidden = true;

  overlayEl.innerHTML = `
    <div class="cart-modal">
      <button type="button" class="cart-modal-close" aria-label="Close dialog">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="cart-modal-header">
        <span class="cart-modal-status-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        <h2>Product successfully added to cart</h2>
      </div>
      <div class="cart-modal-content">
        <!-- Product info details -->
        <div class="cart-modal-product">
          <div class="cart-modal-product-media">
            <img class="cart-modal-product-img" src="" alt="">
          </div>
          <div class="cart-modal-product-info">
            <span class="cart-modal-product-category"></span>
            <h3 class="cart-modal-product-title"></h3>
            <p class="cart-modal-product-meta"></p>
          </div>
        </div>
        
        <!-- Order Stats and Navigation links -->
        <div class="cart-modal-summary">
          <div class="cart-modal-summary-title">Cart Summary</div>
          <div class="cart-modal-summary-row" style="display: none;">
            <span>Subtotal</span>
            <strong class="cart-modal-subtotal"></strong>
          </div>
          <div class="cart-modal-summary-row">
            <span>Total Items</span>
            <strong class="cart-modal-items-count"></strong>
          </div>
          
          <!-- Shipping tracker - hidden for now; remove hidden attr to re-enable -->
          <div class="cart-modal-delivery" hidden>
            <p class="cart-modal-delivery-text"></p>
            <div class="cart-modal-delivery-track">
              <div class="cart-modal-delivery-bar"></div>
            </div>
          </div>
          
          <div class="cart-modal-actions">
            <button type="button" class="btn btn-outline-light cart-modal-continue">Continue Shopping</button>
            <a href="/pages/cart" class="btn btn-primary cart-modal-checkout">Proceed to Cart</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlayEl);

  // Close events
  const closeBtn = overlayEl.querySelector('.cart-modal-close');
  const continueBtn = overlayEl.querySelector('.cart-modal-continue');

  const hide = () => hideCartModal();
  closeBtn.addEventListener('click', hide);
  continueBtn.addEventListener('click', hide);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) hide();
  });

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlayEl.hidden) hide();
  });
}

export function showCartModal(product, quantityAdded = 1) {
  ensureModalCreated();

  const state = getState();

  // 1. Hydrate added product details
  const imgEl = overlayEl.querySelector('.cart-modal-product-img');
  const categoryEl = overlayEl.querySelector('.cart-modal-product-category');
  const titleEl = overlayEl.querySelector('.cart-modal-product-title');
  const metaEl = overlayEl.querySelector('.cart-modal-product-meta');

  imgEl.src = product.image;
  imgEl.alt = product.name;
  categoryEl.textContent = getCategoryName(product.category);
  titleEl.textContent = product.name;
  metaEl.innerHTML = `
    Qty: <strong>${quantityAdded}</strong>
  `;

  // 2. Hydrate cart summary
  const subtotalEl = overlayEl.querySelector('.cart-modal-subtotal');
  const countEl = overlayEl.querySelector('.cart-modal-items-count');

  if (subtotalEl) subtotalEl.textContent = formatPrice(state.subtotal);
  if (countEl) countEl.textContent = String(state.totalItems);

  // 3. Free delivery meter — hidden for now
  // To re-enable: remove `hidden` from .cart-modal-delivery in the HTML template above
  // and uncomment the block below:
  //
  // const deliveryTextEl = overlayEl.querySelector('.cart-modal-delivery-text');
  // const deliveryBarEl  = overlayEl.querySelector('.cart-modal-delivery-bar');
  // if (state.amountToFreeDelivery <= 0) {
  //   deliveryTextEl.innerHTML = '<strong>Free delivery unlocked!</strong>';
  //   deliveryBarEl.style.width = '100%';
  //   deliveryBarEl.classList.add('is-complete');
  // } else {
  //   deliveryTextEl.innerHTML = `Spend <strong>${formatPrice(state.amountToFreeDelivery)}</strong> more for free delivery.`;
  //   deliveryBarEl.style.width = `${Math.min(100, (state.subtotal / FREE_DELIVERY_THRESHOLD) * 100).toFixed(1)}%`;
  //   deliveryBarEl.classList.remove('is-complete');
  // }

  // 4. Open with animation
  overlayEl.hidden = false;
  document.body.style.overflow = 'hidden'; // lock scrolling

  // Trigger browser paint transition
  requestAnimationFrame(() => {
    overlayEl.classList.add('is-visible');
  });
}

export function hideCartModal() {
  if (!overlayEl) return;

  overlayEl.classList.remove('is-visible');
  document.body.style.overflow = ''; // unlock scroll

  // Wait for CSS transition before hiding
  setTimeout(() => {
    if (!overlayEl.classList.contains('is-visible')) {
      overlayEl.hidden = true;
    }
  }, 300);
}
