/**
 * RESOLVEFARM - Farm Shop page controller
 *
 * Owns the category tabs, search, sort and grid. All product facts come from
 * product-service; this file only decides what to show.
 *
 * Filter state is mirrored into the query string (?category=peppers&q=hot) so a
 * filtered view can be shared, bookmarked and reached from other pages.
 */

import {
  getAllProducts,
  getCategoriesWithCounts,
  getCategoryName,
  getFeaturedProducts,
  getProductById,
  searchProducts,
  sortProducts,
  productsLoaded
} from './product-service.js';
import {
  bindProductCardActions,
  renderProductGrid
} from './product-card.js';

let ALL_PRODUCTS = [];

const state = {
  category: 'all',
  query: '',
  sort: 'featured'
};

const el = {};

/* ---------------------------------------------------------------------------
   Rendering
   --------------------------------------------------------------------------- */

function renderCategoryTabs() {
  const categories = getCategoriesWithCounts();

  const tabs = [
    { id: 'all', name: 'All Products', count: ALL_PRODUCTS.length },
    ...categories
  ];

  el.categoryNav.innerHTML = tabs
    .map(
      (cat) => `
        <button
          type="button"
          class="filter-btn shop-category-btn"
          data-category="${cat.id}"
          role="tab"
          aria-selected="false">
          ${cat.name}
          <span class="filter-count">${cat.count}</span>
        </button>
      `
    )
    .join('');
}

/** Apply the current category + query + sort to the catalogue. */
function getVisibleProducts() {
  const byCategory =
    state.category === 'all'
      ? ALL_PRODUCTS
      : ALL_PRODUCTS.filter((p) => p.category === state.category);

  return sortProducts(searchProducts(byCategory, state.query), state.sort);
}

function renderGrid() {
  const products = getVisibleProducts();

  el.grid.innerHTML = renderProductGrid(products);
  el.grid.hidden = products.length === 0;
  el.empty.hidden = products.length > 0;

  if (products.length === 0) {
    el.emptyQuery.textContent = state.query
      ? `"${state.query}"`
      : getCategoryName(state.category).toLowerCase();
  }

  renderResultCount(products.length);
  revealCards();
}

function renderResultCount(count) {
  const scope =
    state.category === 'all' ? '' : ` in ${getCategoryName(state.category)}`;
  const noun = count === 1 ? 'product' : 'products';

  el.resultCount.textContent = state.query
    ? `${count} ${noun}${scope} matching "${state.query}"`
    : `Showing ${count} ${noun}${scope}`;
}

/**
 * The global IntersectionObserver in animations.js only sees elements that
 * existed at DOMContentLoaded, so cards injected here reveal themselves - with a
 * short stagger for the same feel as the rest of the site.
 */
function revealCards() {
  const cards = el.grid.querySelectorAll('.product-card');

  requestAnimationFrame(() => {
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${Math.min(index, 8) * 45}ms`;
      card.classList.add('is-visible');
    });
  });
}

function renderFeatured() {
  if (!el.featuredRail) return;
  const featured = getFeaturedProducts();
  el.featuredRail.innerHTML = renderProductGrid(featured);

  requestAnimationFrame(() => {
    el.featuredRail
      .querySelectorAll('.product-card')
      .forEach((card) => card.classList.add('is-visible'));
  });
}

function syncControls() {
  el.categoryNav.querySelectorAll('[data-category]').forEach((button) => {
    const isActive = button.dataset.category === state.category;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  if (el.searchInput.value !== state.query) el.searchInput.value = state.query;
  if (el.sortSelect.value !== state.sort) el.sortSelect.value = state.sort;
  el.searchClear.hidden = state.query === '';
}

/* ---------------------------------------------------------------------------
   URL state
   --------------------------------------------------------------------------- */

function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const validCategories = ['all', ...getCategoriesWithCounts().map((c) => c.id)];

  if (category && validCategories.includes(category)) state.category = category;
  state.query = params.get('q') || '';
  if (params.get('sort')) state.sort = params.get('sort');
}

/* Written with replaceState so typing in the search box doesn't fill the
   browser history with one entry per keystroke. */
function writeStateToUrl() {
  const params = new URLSearchParams();
  if (state.category !== 'all') params.set('category', state.category);
  if (state.query) params.set('q', state.query);
  if (state.sort !== 'featured') params.set('sort', state.sort);

  const query = params.toString();
  window.history.replaceState(
    null,
    '',
    query ? `${window.location.pathname}?${query}` : window.location.pathname
  );
}

function update() {
  syncControls();
  renderGrid();
  writeStateToUrl();
}

/* ---------------------------------------------------------------------------
   Events
   --------------------------------------------------------------------------- */

function bindEvents() {
  el.categoryNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    update();
  });

  // Debounced so a fast typist doesn't trigger a re-render per character.
  let searchTimer = null;
  el.searchInput.addEventListener('input', (event) => {
    const value = event.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = value.trim();
      update();
    }, 180);
  });

  // Enter must not submit and reload the page.
  el.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(searchTimer);
    state.query = el.searchInput.value.trim();
    update();
  });

  el.searchClear.addEventListener('click', () => {
    state.query = '';
    el.searchInput.value = '';
    el.searchInput.focus();
    update();
  });

  el.sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    update();
  });

  el.resetFilters.addEventListener('click', () => {
    state.category = 'all';
    state.query = '';
    state.sort = 'featured';
    update();
  });

  bindProductCardActions(el.grid, { getProduct: getProductById });
  bindProductCardActions(el.featuredRail, { getProduct: getProductById });
}

/* ---------------------------------------------------------------------------
   Init
   --------------------------------------------------------------------------- */

async function init() {
  el.categoryNav = document.querySelector('[data-shop-categories]');
  el.grid = document.querySelector('[data-shop-grid]');
  el.empty = document.querySelector('[data-shop-empty]');
  el.emptyQuery = document.querySelector('[data-shop-empty-query]');
  el.resultCount = document.querySelector('[data-shop-count]');
  el.searchForm = document.querySelector('[data-shop-search-form]');
  el.searchInput = document.querySelector('[data-shop-search]');
  el.searchClear = document.querySelector('[data-shop-search-clear]');
  el.sortSelect = document.querySelector('[data-shop-sort]');
  el.resetFilters = document.querySelector('[data-shop-reset]');
  el.featuredRail = document.querySelector('[data-shop-featured]');

  // Not the shop page - nothing to do.
  if (!el.grid || !el.categoryNav) return;

  await productsLoaded;
  ALL_PRODUCTS = getAllProducts();

  readStateFromUrl();
  renderCategoryTabs();
  renderFeatured();
  bindEvents();
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
