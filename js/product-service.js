/**
 * RESOLVEFARM - Product Service
 *
 * The read layer between the catalogue and the UI. Every page asks this module
 * for products; nothing imports products.js directly except this file. That is
 * deliberate: when the Admin Dashboard + database arrive, only the internals of
 * these functions change (sync array reads become async fetches) and the shop,
 * detail, cart and checkout pages keep working against the same names.
 */

import { PRODUCTS, CATEGORIES } from './products.js';

/* ---------------------------------------------------------------------------
   Reads
   --------------------------------------------------------------------------- */

/** Every product, in catalogue order. Returns copies so callers can't mutate the source. */
export function getAllProducts() {
  return PRODUCTS.map((p) => ({ ...p }));
}

export function getProductBySlug(slug) {
  if (!slug) return null;
  const found = PRODUCTS.find((p) => p.slug === slug);
  return found ? { ...found } : null;
}

export function getProductById(id) {
  if (!id) return null;
  const found = PRODUCTS.find((p) => p.id === id);
  return found ? { ...found } : null;
}

export function getProductsByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return getAllProducts();
  return PRODUCTS.filter((p) => p.category === categoryId).map((p) => ({ ...p }));
}

export function getFeaturedProducts() {
  return PRODUCTS.filter((p) => p.featured).map((p) => ({ ...p }));
}

/**
 * Categories that actually have stock-listed products, each with a count.
 * Empty categories are omitted so the shop never renders a dead tab.
 */
export function getCategoriesWithCounts() {
  return CATEGORIES
    .map((c) => ({ ...c, count: PRODUCTS.filter((p) => p.category === c.id).length }))
    .filter((c) => c.count > 0);
}

export function getCategoryName(categoryId) {
  if (categoryId === 'all') return 'All Products';
  return CATEGORIES.find((c) => c.id === categoryId)?.name || 'Produce';
}

/**
 * Related products: same category first, topped up with featured items from
 * elsewhere so the detail page rail is never sparse. Never includes itself.
 */
export function getRelatedProducts(product, limit = 3) {
  if (!product) return [];
  const sameCategory = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  );
  const fallback = PRODUCTS.filter(
    (p) => p.featured && p.id !== product.id && !sameCategory.some((s) => s.id === p.id)
  );
  return [...sameCategory, ...fallback].slice(0, limit).map((p) => ({ ...p }));
}

/* ---------------------------------------------------------------------------
   Search + sort
   --------------------------------------------------------------------------- */

/**
 * Case-insensitive search across name, descriptions, category and tags.
 * Every whitespace-separated term must match somewhere (AND), so
 * "hot pepper" narrows rather than widens.
 */
export function searchProducts(products, query) {
  const terms = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!terms.length) return products;

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.shortDescription,
      product.description,
      getCategoryName(product.category),
      ...(product.tags || [])
    ]
      .join(' ')
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
}

const SORTERS = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'name-asc': (a, b) => a.name.localeCompare(b.name)
};

export function sortProducts(products, sortKey = 'featured') {
  const sorter = SORTERS[sortKey] || SORTERS.featured;
  return [...products].sort(sorter);
}

/* ---------------------------------------------------------------------------
   Formatting + display helpers
   --------------------------------------------------------------------------- */

const CURRENCY = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD'
});

/** 4.99 -> "$4.99". Used everywhere a price is shown, so the format never drifts. */
export function formatPrice(amount) {
  return CURRENCY.format(Number(amount) || 0);
}

/** 4.99, 'lb' -> "$4.99 / lb" */
export function formatUnitPrice(amount, unit) {
  return `${formatPrice(amount)} / ${unit}`;
}

const AVAILABILITY_LABELS = {
  'in-stock': 'In Stock',
  seasonal: 'In Season',
  'out-of-stock': 'Sold Out'
};

export function getAvailabilityLabel(availability) {
  return AVAILABILITY_LABELS[availability] || 'Unavailable';
}

export function isPurchasable(product) {
  return Boolean(product) && product.availability !== 'out-of-stock' && product.stock > 0;
}
