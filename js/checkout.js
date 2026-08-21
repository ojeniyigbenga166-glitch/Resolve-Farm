/**
 * RESOLVEFARM - Checkout controller
 *
 * Validates the delivery details, builds an order record and hands off to the
 * confirmation page.
 *
 * IMPORTANT - NO BACKEND YET: this site is a static front end, so there is no
 * server to accept an order and no payment processor to charge a card. Checkout
 * therefore captures the order and persists it locally
 * (localStorage: resolvefarm_last_order) so the confirmation page can show it.
 * `submitOrder()` below is the single, deliberate seam: when the API exists,
 * replace its body with a POST and everything else on this page still holds.
 * The UI states this plainly rather than pretending a payment was taken.
 */

import {
  clearCart,
  getState,
  subscribe,
  DELIVERY_FLAT_FEE,
  FREE_DELIVERY_THRESHOLD
} from './cart-store.js';
import { formatPrice } from './product-service.js';
import { escapeHtml } from './dom.js';

const ORDER_STORAGE_KEY = 'resolvefarm_last_order';

const el = {};
let unsubscribe = null;

/* ---------------------------------------------------------------------------
   Validation rules
   --------------------------------------------------------------------------- */

const RULES = {
  fullName: {
    label: 'Full name',
    validate: (v) => v.trim().length >= 2 || 'Please enter your full name.'
  },
  email: {
    label: 'Email',
    validate: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ||
      'Please enter a valid email address.'
  },
  phone: {
    label: 'Phone',
    validate: (v) =>
      // Digits only after stripping formatting; NANP numbers are 10-11 digits.
      /^\d{10,11}$/.test(v.replace(/[\s()+-]/g, '')) ||
      'Please enter a valid phone number.'
  },
  address: {
    label: 'Street address',
    validate: (v) => v.trim().length >= 5 || 'Please enter your street address.'
  },
  city: {
    label: 'City',
    validate: (v) => v.trim().length >= 2 || 'Please enter your city.'
  },
  province: {
    label: 'Province',
    validate: (v) => Boolean(v) || 'Please select your province.'
  },
  postalCode: {
    label: 'Postal code',
    validate: (v) =>
      /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.trim()) ||
      'Please enter a valid Canadian postal code (e.g. N0R 1K0).'
  }
};

function setFieldError(field, message) {
  const wrapper = field.closest('.checkout-field');
  const errorEl = wrapper?.querySelector('.checkout-error');

  if (message) {
    field.setAttribute('aria-invalid', 'true');
    wrapper?.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  } else {
    field.removeAttribute('aria-invalid');
    wrapper?.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }
}

function validateField(field) {
  const rule = RULES[field.name];
  if (!rule) return true;

  const result = rule.validate(field.value);
  setFieldError(field, result === true ? '' : result);
  return result === true;
}

function validateForm() {
  const fields = Object.keys(RULES)
    .map((name) => el.form.elements[name])
    .filter(Boolean);

  // Validate every field (don't stop at the first) so the customer sees all
  // problems at once instead of fixing them one reload at a time.
  const results = fields.map((field) => validateField(field));
  const firstInvalid = fields.find((field) => field.getAttribute('aria-invalid'));

  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  return results.every(Boolean);
}

/* ---------------------------------------------------------------------------
   Order summary
   --------------------------------------------------------------------------- */

function renderSummary(state) {
  // An empty cart cannot be checked out - swap the whole page for a prompt.
  if (state.isEmpty) {
    el.layout.hidden = true;
    el.empty.hidden = false;
    return;
  }

  el.layout.hidden = false;
  el.empty.hidden = true;

  el.summaryLines.innerHTML = state.items
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

  el.subtotal.textContent = formatPrice(state.subtotal);
  el.delivery.textContent =
    state.deliveryFee === 0 ? 'Free' : formatPrice(state.deliveryFee);
  el.total.textContent = formatPrice(state.grandTotal);

  el.deliveryNote.textContent =
    state.deliveryFee === 0
      ? `Free delivery applied on orders over ${formatPrice(FREE_DELIVERY_THRESHOLD)}.`
      : `Flat-rate delivery ${formatPrice(DELIVERY_FLAT_FEE)}. Free over ${formatPrice(
          FREE_DELIVERY_THRESHOLD
        )}.`;

  el.submitTotal.textContent = formatPrice(state.grandTotal);
}

/* ---------------------------------------------------------------------------
   Order creation
   --------------------------------------------------------------------------- */

function generateOrderNumber() {
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('');
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `RF-${stamp}-${random}`;
}

function buildOrder() {
  const state = getState();
  const data = new FormData(el.form);

  return {
    orderNumber: generateOrderNumber(),
    placedAt: new Date().toISOString(),
    // Snapshot the priced lines. Unlike the cart, an order MUST freeze its
    // prices - what the customer agreed to cannot move if the catalogue changes.
    items: state.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      image: item.image,
      unit: item.unit,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.lineTotal
    })),
    totals: {
      subtotal: state.subtotal,
      deliveryFee: state.deliveryFee,
      grandTotal: state.grandTotal
    },
    customer: {
      fullName: String(data.get('fullName') || '').trim(),
      email: String(data.get('email') || '').trim(),
      phone: String(data.get('phone') || '').trim()
    },
    delivery: {
      address: String(data.get('address') || '').trim(),
      city: String(data.get('city') || '').trim(),
      province: String(data.get('province') || ''),
      postalCode: String(data.get('postalCode') || '').trim().toUpperCase(),
      notes: String(data.get('notes') || '').trim()
    },
    paymentMethod: String(data.get('paymentMethod') || 'pay-on-delivery')
  };
}

/**
 * The API seam. Today it persists locally; tomorrow it becomes
 * `await fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) })`
 * and no caller has to change.
 */
async function submitOrder(order) {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  return { ok: true, order };
}

/* ---------------------------------------------------------------------------
   Events
   --------------------------------------------------------------------------- */

function bindEvents() {
  // Validate on blur so errors appear as the customer moves on, not mid-typing.
  Object.keys(RULES).forEach((name) => {
    const field = el.form.elements[name];
    if (!field) return;

    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      // Clear a resolved error immediately; don't nag while they fix it.
      if (field.getAttribute('aria-invalid') && RULES[name].validate(field.value) === true) {
        setFieldError(field, '');
      }
    });
  });

  el.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (getState().isEmpty) return;
    if (!validateForm()) return;

    el.submitBtn.disabled = true;
    el.submitBtn.classList.add('is-loading');

    try {
      const order = buildOrder();
      const result = await submitOrder(order);

      if (!result.ok) throw new Error('Order was not accepted.');

      // Stop re-rendering before clearing, otherwise the subscriber would
      // immediately swap in the "cart is empty" state during the redirect.
      unsubscribe?.();
      clearCart();

      window.location.href = 'order-confirmation';
    } catch (error) {
      console.error('Checkout failed.', error);
      el.formError.hidden = false;
      el.formError.textContent =
        'We could not place your order just now. Please try again, or call us on +1 (800) 234-5678.';
      el.submitBtn.disabled = false;
      el.submitBtn.classList.remove('is-loading');
    }
  });
}

/* ---------------------------------------------------------------------------
   Init
   --------------------------------------------------------------------------- */

function init() {
  el.form = document.querySelector('[data-checkout-form]');
  if (!el.form) return;

  el.layout = document.querySelector('[data-checkout-layout]');
  el.empty = document.querySelector('[data-checkout-empty]');
  el.summaryLines = document.querySelector('[data-checkout-lines]');
  el.subtotal = document.querySelector('[data-checkout-subtotal]');
  el.delivery = document.querySelector('[data-checkout-delivery]');
  el.total = document.querySelector('[data-checkout-total]');
  el.deliveryNote = document.querySelector('[data-checkout-delivery-note]');
  el.submitBtn = document.querySelector('[data-checkout-submit]');
  el.submitTotal = document.querySelector('[data-checkout-submit-total]');
  el.formError = document.querySelector('[data-checkout-error]');

  bindEvents();
  unsubscribe = subscribe(renderSummary);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
