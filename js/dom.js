/**
 * RESOLVEFARM - Shared DOM helpers for the shop pages.
 */

/**
 * Escape text before it goes into an HTML template string.
 * Product copy is currently authored by hand, but once the Admin Dashboard
 * writes it a stray quote or angle bracket must not be able to break markup.
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Brief, non-blocking confirmation ("Fresh Tomatoes added to cart").
 * Announced politely so screen readers hear it without stealing focus.
 */
let toastTimer = null;

export function showToast(message) {
  let toast = document.querySelector('.shop-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'shop-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span class="shop-toast-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span>${escapeHtml(message)}</span>
  `;

  // Restart the entry animation even if a toast is already on screen.
  toast.classList.remove('is-visible');
  void toast.offsetWidth;
  toast.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

/** Read a query-string value, e.g. ?slug=fresh-tomatoes */
export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
