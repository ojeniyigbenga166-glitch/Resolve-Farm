/**
 * RESOLVEFARM - ProductCard
 *
 * The single reusable product tile. Used by the shop grid, the featured rail and
 * the "you may also like" rail on the detail page. Nothing about a product is
 * written by hand here - it all comes from the catalogue via product-service.
 *
 * Returns markup rather than nodes so a grid of cards can be painted in one
 * innerHTML write; interaction is handled by delegation on the grid container
 * (see bindProductCardActions).
 */

import {
  formatPrice,
  getAvailabilityLabel,
  getCategoryName,
  isPurchasable
} from './product-service.js';
import { escapeHtml, showToast } from './dom.js';
import { addItem } from './cart-store.js';
import { showCartModal } from './cart-modal.js';

/** Path from a shop page (all live in /pages/) to the product detail page. */
export function productUrl(product) {
  return `product?slug=${encodeURIComponent(product.slug)}`;
}

export function renderProductCard(product) {
  const purchasable = isPurchasable(product);
  const name = escapeHtml(product.name);
  const href = productUrl(product);

  const badge = product.badge
    ? `<span class="product-card-badge">${escapeHtml(product.badge)}</span>`
    : '';

  return `
    <article class="product-card fade-in" data-product-id="${escapeHtml(product.id)}">
      <a class="product-card-media" href="${href}" aria-label="View ${name}">
        <img src="${escapeHtml(product.image)}" alt="${name}" loading="lazy" decoding="async">
        ${badge}
        <span class="product-card-availability is-${escapeHtml(product.availability)}">
          ${escapeHtml(getAvailabilityLabel(product.availability))}
        </span>
      </a>

      <div class="product-card-body">
        <span class="product-card-category">${escapeHtml(getCategoryName(product.category))}</span>
        <h3 class="product-card-title"><a href="${href}">${name}</a></h3>
        <p class="product-card-desc">${escapeHtml(product.shortDescription)}</p>

        <div class="product-card-footer">
          <p class="product-card-price">
            <strong>${formatPrice(product.price)}</strong> / ${escapeHtml(product.unit)}
          </p>
          ${
            purchasable && product.stock <= 10
              ? `<span class="product-card-stock">Only ${product.stock} left</span>`
              : ''
          }
        </div>

        <button
          type="button"
          class="btn btn-primary product-card-add"
          data-add-to-cart="${escapeHtml(product.id)}"
          ${purchasable ? '' : 'disabled'}>
          ${purchasable ? 'Add to Cart' : 'Sold Out'}
          <span class="btn-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </span>
        </button>
      </div>
    </article>
  `;
}

export function renderProductGrid(products) {
  if (!products || !products.length) return '';
  return products.map(renderProductCard).join('');
}

/**
 * Delegated "Add to Cart" handling for any container holding product cards.
 * Delegation means a re-rendered grid needs no re-binding.
 */
export function bindProductCardActions(container, { getProduct }) {
  if (!container) return;

  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-to-cart]');
    if (!button || button.disabled) return;

    const productId = button.getAttribute('data-add-to-cart');
    const added = addItem(productId, 1);

    if (!added) {
      showToast('Sorry, that item is unavailable.');
      return;
    }

    const product = getProduct(productId);
    if (product) {
      showCartModal(product, 1);
    }

    // Momentary confirmation on the button itself.
    button.classList.add('is-added');
    setTimeout(() => button.classList.remove('is-added'), 900);
  });
}
