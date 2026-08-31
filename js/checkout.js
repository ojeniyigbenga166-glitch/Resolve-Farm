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
import { escapeHtml } from './dom.js';
import { supabase } from './supabaseClient.js';

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
            <span>${item.quantity} × ${escapeHtml(item.unit)}</span>
          </div>
        </li>
      `
    )
    .join('');

  if (el.subtotal) el.subtotal.textContent = '';
  if (el.delivery) el.delivery.textContent = '';
  if (el.total) el.total.textContent = '';

  if (el.deliveryNote) el.deliveryNote.style.display = 'none';
  if (el.submitTotal) el.submitTotal.style.display = 'none';
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
      price: 0,
      quantity: item.quantity,
      lineTotal: 0
    })),
    totals: {
      subtotal: 0,
      deliveryFee: 0,
      grandTotal: 0
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
    paymentMethod: String(data.get('paymentMethod') || 'WhatsApp Direct')
  };
}

function buildWhatsAppUrl(order) {
  const phone = '15146297097';
  let msg = `🛒 *NEW ORDER REQUEST: ${order.orderNumber}*\n`;
  msg += `-----------------------------------\n`;
  msg += `👤 *Name:* ${order.customer.fullName}\n`;
  msg += `📞 *Phone:* ${order.customer.phone}\n`;
  msg += `✉️ *Email:* ${order.customer.email}\n`;
  msg += `📍 *Delivery Address:* ${order.delivery.address}, ${order.delivery.city}, ${order.delivery.province} ${order.delivery.postalCode}\n`;
  if (order.delivery.notes) {
    msg += `📝 *Notes:* ${order.delivery.notes}\n`;
  }
  msg += `-----------------------------------\n`;
  msg += `📦 *ORDERED ITEMS:*\n`;
  order.items.forEach((item, index) => {
    msg += `${index + 1}. *${item.name}* (${item.quantity} × ${item.unit})\n`;
  });
  msg += `-----------------------------------\n`;
  msg += `Hello RESOLVEFARM, I would like to place this order request. Please contact me with pricing and delivery details.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Persists order locally and prepares WhatsApp link.
 */
async function submitOrder(order) {
  const waUrl = buildWhatsAppUrl(order);
  order.whatsappUrl = waUrl;
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));

  try {
    const dbOrder = {
      id: order.orderNumber,
      customer: {
        name: order.customer.fullName,
        email: order.customer.email,
        phone: order.customer.phone,
        address: `${order.delivery.address}, ${order.delivery.city}, ${order.delivery.province} ${order.delivery.postalCode}`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60' // Default avatar as in dashboard
      },
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'pending',
      items: order.items.map(item => ({
        id: isNaN(parseInt(item.id)) ? item.id : parseInt(item.id),
        name: item.name,
        price: 0,
        qty: item.quantity,
        img: item.image
      })),
      delivery_fee: 0,
      notes: order.delivery.notes || '',
      timeline: [
        {
          status: 'pending',
          title: 'Order Placed',
          description: 'Your order was received and is pending confirmation.',
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }
      ]
    };

    const { error } = await supabase
      .from('orders')
      .insert([dbOrder]);

    if (error) throw error;
  } catch (err) {
    console.error('Failed to save order to Supabase:', err);
    // Proceed so user can complete order via WhatsApp direct
  }

  return { ok: true, order, waUrl };
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

      // Open WhatsApp with pre-filled message
      if (result.waUrl) {
        window.open(result.waUrl, '_blank');
      }

      // Stop re-rendering before clearing
      unsubscribe?.();
      clearCart();

      window.location.href = 'order-confirmation';
    } catch (error) {
      console.error('Checkout failed.', error);
      el.formError.hidden = false;
      el.formError.textContent =
        'We could not place your order just now. Please try again, or call us on +1 (514) 629-7097.';
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
