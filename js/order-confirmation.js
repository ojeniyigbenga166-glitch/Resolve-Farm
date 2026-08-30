/**
 * RESOLVEFARM - Order confirmation controller
 *
 * Renders the order written by checkout.js. Reached only by redirect after a
 * successful submit; landing here directly (refresh days later, shared link,
 * bookmark) shows a graceful fallback instead of an empty template.
 */

import { formatPrice } from './product-service.js';
import { escapeHtml } from './dom.js';

const ORDER_STORAGE_KEY = 'resolvefarm_last_order';

const PROVINCE_NAMES = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon'
};

function loadOrder() {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return null;

    const order = JSON.parse(raw);
    // Guard against a truncated or hand-edited record.
    if (!order?.orderNumber || !Array.isArray(order.items) || !order.items.length) {
      return null;
    }
    return order;
  } catch (error) {
    console.warn('Could not read the last order.', error);
    return null;
  }
}

function formatPlacedAt(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/** Harvest-and-deliver window: 2-4 business-ish days after the order. */
function formatDeliveryWindow(iso) {
  const placed = new Date(iso);
  if (Number.isNaN(placed.getTime())) return '';

  const from = new Date(placed);
  from.setDate(from.getDate() + 2);
  const to = new Date(placed);
  to.setDate(to.getDate() + 4);

  const options = { month: 'short', day: 'numeric' };
  return `${from.toLocaleDateString('en-CA', options)} – ${to.toLocaleDateString(
    'en-CA',
    options
  )}`;
}

function render(order) {
  document.querySelector('[data-order-number]').textContent = order.orderNumber;
  document.querySelector('[data-order-date]').textContent = formatPlacedAt(order.placedAt);
  document.querySelector('[data-order-window]').textContent = formatDeliveryWindow(
    order.placedAt
  );
  document.querySelector('[data-order-email]').textContent = order.customer.email;

  document.querySelector('[data-order-lines]').innerHTML = order.items
    .map(
      (item) => `
        <li class="checkout-summary-line">
          <img src="${escapeHtml(item.image)}" alt="" loading="lazy">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.quantity} × ${formatPrice(item.price)} / ${escapeHtml(item.unit)}</span>
          </div>
          <span class="checkout-summary-amount">${formatPrice(item.lineTotal)}</span>
        </li>
      `
    )
    .join('');

  document.querySelector('[data-order-subtotal]').textContent = formatPrice(
    order.totals.subtotal
  );
  document.querySelector('[data-order-delivery]').textContent =
    order.totals.deliveryFee === 0 ? 'Free' : formatPrice(order.totals.deliveryFee);
  document.querySelector('[data-order-total]').textContent = formatPrice(
    order.totals.grandTotal
  );

  const province = PROVINCE_NAMES[order.delivery.province] || order.delivery.province;
  document.querySelector('[data-order-address]').innerHTML = [
    escapeHtml(order.customer.fullName),
    escapeHtml(order.delivery.address),
    `${escapeHtml(order.delivery.city)}, ${escapeHtml(province)} ${escapeHtml(
      order.delivery.postalCode
    )}`,
    escapeHtml(order.customer.phone)
  ].join('<br>');

  const notesEl = document.querySelector('[data-order-notes-block]');
  if (order.delivery.notes) {
    document.querySelector('[data-order-notes]').textContent = order.delivery.notes;
    notesEl.hidden = false;
  } else {
    notesEl.hidden = true;
  }

  const waBtn = document.querySelector('[data-order-whatsapp-btn]');
  if (waBtn) {
    if (order.whatsappUrl) {
      waBtn.href = order.whatsappUrl;
    } else {
      const phone = '15146297097';
      const msg = encodeURIComponent(`Hello RESOLVEFARM, inquiring about order ${order.orderNumber}.`);
      waBtn.href = `https://wa.me/${phone}?text=${msg}`;
    }
  }
}

function init() {
  const success = document.querySelector('[data-order-success]');
  if (!success) return;

  const fallback = document.querySelector('[data-order-fallback]');
  const order = loadOrder();

  if (!order) {
    success.hidden = true;
    fallback.hidden = false;
    return;
  }

  render(order);
  success.hidden = false;
  fallback.hidden = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
