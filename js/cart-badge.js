/**
 * RESOLVEFARM - Cart badge
 *
 * Keeps the count bubble on the header cart icon in sync with the store, on
 * every page. Imported by main.js (which every page already loads) so the badge
 * is live site-wide rather than only inside the shop.
 */

import { subscribe } from './cart-store.js';

function render(state) {
  document.querySelectorAll('.cart-icon').forEach((icon) => {
    let badge = icon.querySelector('.cart-badge');

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-badge';
      icon.appendChild(badge);
    }

    badge.textContent = state.totalItems > 99 ? '99+' : String(state.totalItems);
    badge.hidden = state.totalItems === 0;

    // Keep the accessible name in step with the visible count.
    icon.setAttribute(
      'aria-label',
      state.totalItems === 0
        ? 'Cart, empty'
        : `Cart, ${state.totalItems} item${state.totalItems === 1 ? '' : 's'}`
    );
  });
}

function init() {
  if (!document.querySelector('.cart-icon')) return;
  subscribe(render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
