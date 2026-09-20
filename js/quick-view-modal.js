/**
 * RESOLVEFARM - Quick View Modal
 * 
 * Renders an interactive popup modal for any product card allowing customers
 * to toggle between Canadian packaging options (Single Box, Double Box, Basket/Hamper, Bags),
 * select quantities, and send an instant inquiry to WhatsApp or add to order list.
 */

import { escapeHtml, showToast } from './dom.js';
import { addItem } from './cart-store.js';

let activeModal = null;

export function openQuickViewModal(product) {
  closeQuickViewModal();

  if (!product) return;

  const packagingOptions = product.packagingOptions || [
    { id: 'single-box', name: 'Single Box', icon: '📦' },
    { id: 'basket-hamper', name: 'Basket (Hamper)', icon: '🧺' }
  ];

  let selectedOption = packagingOptions[0];
  let quantity = 1;

  const backdrop = document.createElement('div');
  backdrop.className = 'quick-view-backdrop';

  const modalHtml = `
    <div class="quick-view-modal" role="dialog" aria-modal="true" aria-labelledby="qv-title">
      <button class="quick-view-close" aria-label="Close Quick View">&times;</button>
      
      <div class="quick-view-grid">
        <div class="quick-view-media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
          ${product.badge ? `<span class="quick-view-badge">${escapeHtml(product.badge)}</span>` : ''}
        </div>
        
        <div class="quick-view-details">
          <span class="quick-view-category">${escapeHtml(product.category.toUpperCase())}</span>
          <h2 id="qv-title" class="quick-view-title">${escapeHtml(product.name)}</h2>
          <p class="quick-view-desc">${escapeHtml(product.description || product.shortDescription)}</p>

          <div class="quick-view-packaging-section">
            <label class="quick-view-label">Select Packaging Type:</label>
            <div class="quick-view-packaging-pills">
              ${packagingOptions.map((opt, idx) => `
                <button type="button" 
                  class="packaging-pill ${idx === 0 ? 'is-selected' : ''}" 
                  data-pkg-id="${escapeHtml(opt.id)}"
                  data-pkg-name="${escapeHtml(opt.name)}">
                  <span class="pkg-icon">${opt.icon || '📦'}</span>
                  <span class="pkg-name">${escapeHtml(opt.name)}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="quick-view-quantity-section">
            <label class="quick-view-label">Quantity:</label>
            <div class="quick-view-quantity-picker">
              <button type="button" class="qv-qty-btn qv-minus" aria-label="Decrease">&minus;</button>
              <span class="qv-qty-val">1</span>
              <button type="button" class="qv-qty-btn qv-plus" aria-label="Increase">+</button>
            </div>
          </div>

          <div class="quick-view-actions">
            <button type="button" class="btn btn-whatsapp qv-whatsapp-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.551 4.101 1.517 5.832L0 24l6.335-1.485C8.016 23.46 9.957 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.805 0-3.561-.476-5.111-1.378l-.367-.212-3.793.889.907-3.694-.233-.377A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
              Order on WhatsApp
            </button>
            <button type="button" class="btn btn-outline qv-add-cart-btn">
              Add to Order List
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  backdrop.innerHTML = modalHtml;
  document.body.appendChild(backdrop);
  activeModal = backdrop;

  requestAnimationFrame(() => backdrop.classList.add('is-open'));

  // Event bindings
  const closeBtn = backdrop.querySelector('.quick-view-close');
  closeBtn.addEventListener('click', closeQuickViewModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeQuickViewModal();
  });

  // Packaging pills click
  const pills = backdrop.querySelectorAll('.packaging-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('is-selected'));
      pill.classList.add('is-selected');
      const optId = pill.dataset.pkgId;
      selectedOption = packagingOptions.find(o => o.id === optId) || packagingOptions[0];
    });
  });

  // Quantity controls
  const qtyVal = backdrop.querySelector('.qv-qty-val');
  backdrop.querySelector('.qv-minus').addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyVal.textContent = String(quantity);
    }
  });

  backdrop.querySelector('.qv-plus').addEventListener('click', () => {
    quantity++;
    qtyVal.textContent = String(quantity);
  });

  // Direct WhatsApp dispatch
  backdrop.querySelector('.qv-whatsapp-btn').addEventListener('click', () => {
    const text = encodeURIComponent(
      `Hello RESOLVEFARM! I would like to place an order:\n\n` +
      `🌾 *Product:* ${product.name}\n` +
      `📦 *Packaging:* ${selectedOption.name}\n` +
      `🔢 *Quantity:* ${quantity}\n\n` +
      `Please confirm availability and final details. Thank you!`
    );
    window.open(`https://wa.me/15146297097?text=${text}`, '_blank');
  });

  // Add to order list
  backdrop.querySelector('.qv-add-cart-btn').addEventListener('click', () => {
    addItem(product.id, quantity, selectedOption.name);
    showToast(`Added ${quantity} x ${product.name} (${selectedOption.name}) to Order List`);
    closeQuickViewModal();
  });
}

export function closeQuickViewModal() {
  if (activeModal) {
    activeModal.classList.remove('is-open');
    setTimeout(() => {
      if (activeModal && activeModal.parentNode) {
        activeModal.parentNode.removeChild(activeModal);
      }
      activeModal = null;
    }, 250);
  }
}
