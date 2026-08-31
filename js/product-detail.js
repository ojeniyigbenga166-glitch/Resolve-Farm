/**
 * RESOLVEFARM - Product detail page controller
 *
 * Reads ?slug= from the URL and renders that product. This is the static-site
 * equivalent of a /products/:slug route: one template, the slug supplied as a
 * query parameter, so a growing catalogue never needs a new HTML file (and the
 * future database can serve any number of products through it).
 */

import {
  getAvailabilityLabel,
  getCategoryName,
  getProductBySlug,
  getProductById,
  getRelatedProducts,
  isPurchasable,
  productsLoaded
} from './product-service.js';
import { escapeHtml, getQueryParam, showToast } from './dom.js';
import { bindProductCardActions, renderProductGrid } from './product-card.js';
import { addItem } from './cart-store.js';

let product = null;
let quantity = 1;

const el = {};

/* ---------------------------------------------------------------------------
   Rendering
   --------------------------------------------------------------------------- */

function renderNotFound() {
  el.notFound.hidden = false;
  el.detail.hidden = true;
  el.related.hidden = true;
  document.title = 'Product not found | RESOLVE FARMS';
}

function renderGallery() {
  const images = [product.image, ...(product.gallery || [])];

  el.mainImage.src = images[0];
  el.mainImage.alt = product.name;

  // A single image needs no thumbnail strip.
  if (images.length < 2) {
    el.thumbs.hidden = true;
    return;
  }

  el.thumbs.innerHTML = images
    .map(
      (src, index) => `
        <button
          type="button"
          class="product-thumb${index === 0 ? ' is-active' : ''}"
          data-image="${escapeHtml(src)}"
          aria-label="View image ${index + 1} of ${images.length}">
          <img src="${escapeHtml(src)}" alt="" loading="lazy">
        </button>
      `
    )
    .join('');
}

function renderInfo() {
  document.title = `${product.name} | Farm Shop | RESOLVE FARMS`;

  const purchasable = isPurchasable(product);

  el.breadcrumbCategory.textContent = getCategoryName(product.category);
  el.breadcrumbCategory.href = `shop?category=${encodeURIComponent(product.category)}`;
  el.breadcrumbName.textContent = product.name;

  el.category.textContent = getCategoryName(product.category);
  el.name.textContent = product.name;
  if (el.price) el.price.textContent = '';
  el.unit.textContent = product.unit;
  el.description.textContent = product.description;

  el.availability.textContent = getAvailabilityLabel(product.availability);
  el.availability.className = `product-detail-availability is-${product.availability}`;

  el.highlights.innerHTML = (product.highlights || [])
    .map(
      (item) => `
        <li>
          <span class="product-highlight-check" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          ${escapeHtml(item)}
        </li>
      `
    )
    .join('');

  el.stockNote.textContent = purchasable
    ? `${product.stock} ${product.unit === 'dozen' ? 'dozen' : product.unit} available`
    : 'Currently unavailable';

  if (!purchasable) {
    el.addBtn.disabled = true;
    el.addBtn.textContent = 'Sold Out';
    el.buyBtn.hidden = true;
    el.quantityControl.hidden = true;
  }
}

function renderQuantity() {
  el.quantityValue.textContent = String(quantity);
  el.quantityDecrease.disabled = quantity <= 1;
  el.quantityIncrease.disabled = quantity >= product.stock;
  if (el.lineTotal) {
    const parentTotal = el.lineTotal.closest('.product-detail-linetotal');
    if (parentTotal) parentTotal.style.display = 'none';
  }
}

function renderRelated() {
  const related = getRelatedProducts(product, 3);

  if (!related.length) {
    el.related.hidden = true;
    return;
  }

  el.relatedRail.innerHTML = renderProductGrid(related);

  requestAnimationFrame(() => {
    el.relatedRail
      .querySelectorAll('.product-card')
      .forEach((card) => card.classList.add('is-visible'));
  });
}

/* ---------------------------------------------------------------------------
   Events
   --------------------------------------------------------------------------- */

import { showCartModal } from './cart-modal.js';

function bindEvents() {
  el.thumbs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-image]');
    if (!button) return;

    el.mainImage.src = button.dataset.image;
    el.thumbs
      .querySelectorAll('.product-thumb')
      .forEach((thumb) => thumb.classList.toggle('is-active', thumb === button));
  });

  el.quantityDecrease.addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    renderQuantity();
  });

  el.quantityIncrease.addEventListener('click', () => {
    quantity = Math.min(product.stock, quantity + 1);
    renderQuantity();
  });

  el.addBtn.addEventListener('click', () => {
    if (!addItem(product.id, quantity)) {
      showToast('Sorry, that item is unavailable.');
      return;
    }
    showCartModal(product, quantity);
    el.addBtn.classList.add('is-added');
    setTimeout(() => el.addBtn.classList.remove('is-added'), 900);
  });

  el.buyBtn.addEventListener('click', () => {
    if (!addItem(product.id, quantity)) {
      showToast('Sorry, that item is unavailable.');
      return;
    }
    window.location.href = 'cart';
  });

  bindProductCardActions(el.relatedRail, { getProduct: getProductById });
}

/* ---------------------------------------------------------------------------
   Init
   --------------------------------------------------------------------------- */

async function init() {
  el.detail = document.querySelector('[data-product-detail]');
  if (!el.detail) return;

  el.notFound = document.querySelector('[data-product-not-found]');
  el.related = document.querySelector('[data-product-related-section]');
  el.relatedRail = document.querySelector('[data-product-related]');

  await productsLoaded;
  product = getProductBySlug(getQueryParam('slug'));

  if (!product) {
    renderNotFound();
    return;
  }

  el.breadcrumbCategory = document.querySelector('[data-breadcrumb-category]');
  el.breadcrumbName = document.querySelector('[data-breadcrumb-name]');
  el.mainImage = document.querySelector('[data-product-image]');
  el.thumbs = document.querySelector('[data-product-thumbs]');
  el.category = document.querySelector('[data-product-category]');
  el.name = document.querySelector('[data-product-name]');
  el.price = document.querySelector('[data-product-price]');
  el.unit = document.querySelector('[data-product-unit]');
  el.description = document.querySelector('[data-product-description]');
  el.availability = document.querySelector('[data-product-availability]');
  el.highlights = document.querySelector('[data-product-highlights]');
  el.stockNote = document.querySelector('[data-product-stock]');
  el.quantityControl = document.querySelector('[data-quantity-control]');
  el.quantityValue = document.querySelector('[data-quantity-value]');
  el.quantityDecrease = document.querySelector('[data-quantity-decrease]');
  el.quantityIncrease = document.querySelector('[data-quantity-increase]');
  el.lineTotal = document.querySelector('[data-product-line-total]');
  el.addBtn = document.querySelector('[data-product-add]');
  el.buyBtn = document.querySelector('[data-product-buy]');

  renderGallery();
  renderInfo();
  renderQuantity();
  renderRelated();
  bindEvents();

  el.detail.hidden = false;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
