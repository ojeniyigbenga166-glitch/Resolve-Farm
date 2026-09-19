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
  getAvailabilityLabel,
  getCategoryName,
  isPurchasable
} from './product-service.js';
import { escapeHtml } from './dom.js';
import { openQuickViewModal } from './quick-view-modal.js';

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

  const packagingList = (product.packagingOptions || [])
    .map(opt => escapeHtml(opt.name))
    .join(' &bull; ');

  return `
    <article class="product-card fade-in" data-product-id="${escapeHtml(product.id)}">
      <div class="product-card-media-wrap">
        <a class="product-card-media" href="${href}" aria-label="View ${name}">
          <img src="${escapeHtml(product.image)}" alt="${name}" loading="lazy" decoding="async">
          ${badge}
          <span class="product-card-availability is-${escapeHtml(product.availability)}">
            ${escapeHtml(getAvailabilityLabel(product.availability))}
          </span>
        </a>
        <button type="button" class="product-card-quick-view" data-quick-view="${escapeHtml(product.id)}">
          ⚡ Quick View
        </button>
      </div>

      <div class="product-card-body">
        <div class="product-card-meta">
          <span class="product-card-category">${escapeHtml(getCategoryName(product.category))}</span>
          ${packagingList ? `<span class="product-card-packaging-tag">${packagingList}</span>` : ''}
        </div>
        <h3 class="product-card-title"><a href="${href}">${name}</a></h3>
        <p class="product-card-desc">${escapeHtml(product.shortDescription)}</p>

        <div class="product-card-footer">
          <button
            type="button"
            class="btn btn-whatsapp product-card-add"
            data-quick-view="${escapeHtml(product.id)}"
            ${purchasable ? '' : 'disabled'}>
            ${purchasable ? 'Order via WhatsApp' : 'Sold Out'}
            <span class="btn-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.551 4.101 1.517 5.832L0 24l6.335-1.485C8.016 23.46 9.957 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.805 0-3.561-.476-5.111-1.378l-.367-.212-3.793.889.907-3.694-.233-.377A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
            </span>
          </button>
        </div>
      </div>
    </article>
  `;
}

export function renderProductGrid(products) {
  if (!products || !products.length) return '';
  return products.map(renderProductCard).join('');
}

/**
 * Delegated handling for any container holding product cards.
 */
export function bindProductCardActions(container, { getProduct }) {
  if (!container) return;

  container.addEventListener('click', (event) => {
    const qvTrigger = event.target.closest('[data-quick-view]');
    if (qvTrigger) {
      const productId = qvTrigger.getAttribute('data-quick-view');
      const product = getProduct(productId);
      if (product) {
        openQuickViewModal(product);
      }
      return;
    }
  });
}

