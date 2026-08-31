/**
 * RESOLVEFARM - Product Service
 *
 * The read layer between the catalogue and the UI. Every page asks this module
 * for products; nothing imports products.js directly except this file. That is
 * deliberate: when the Admin Dashboard + database arrive, only the internals of
 * these functions change (sync array reads become async fetches) and the shop,
 * detail, cart and checkout pages keep working against the same names.
 */

import { supabase } from './supabaseClient.js';
import { PRODUCTS as FALLBACK_PRODUCTS, CATEGORIES } from './products.js';

let PRODUCTS = [];

export const productsLoaded = (async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    PRODUCTS = (data || []).map((dbProduct) => {
      const slug = dbProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      let cat = (dbProduct.category || '').toLowerCase();
      const validCategories = ['tomatoes', 'peppers', 'corn'];
      if (!validCategories.includes(cat)) {
        cat = 'other';
      }

      let availability = 'out-of-stock';
      if (dbProduct.status === 'published') {
        availability = dbProduct.qty > 0 ? 'in-stock' : 'out-of-stock';
      }

      return {
        id: String(dbProduct.id),
        slug,
        name: dbProduct.name,
        category: cat,
        shortDescription: `${dbProduct.name} - Premium quality produce.`,
        description: `${dbProduct.name} grown with purpose at Resolve Farm. Crisp, natural, and handpicked daily.`,
        highlights: [
          'Grown naturally with care',
          'Handpicked for top quality',
          'Delivered fresh to you'
        ],
        image: dbProduct.img || '/assets/images/produce/placeholder.jpg',
        gallery: [],
        unit: dbProduct.unit || 'lb',
        availability,
        stock: dbProduct.qty || 0,
        featured: dbProduct.qty > 0,
        badge: dbProduct.qty > 80 ? 'Best Seller' : '',
        tags: [cat, dbProduct.name.toLowerCase()]
      };
    });
  } catch (err) {
    console.error('Failed to load products from Supabase, using fallback local list:', err);
    PRODUCTS = FALLBACK_PRODUCTS.map((p) => ({ ...p }));
  }
})();

export { CATEGORIES };

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
  'name-asc': (a, b) => a.name.localeCompare(b.name)
};

export function sortProducts(products, sortKey = 'featured') {
  const sorter = SORTERS[sortKey] || SORTERS.featured;
  return [...products].sort(sorter);
}

/* ---------------------------------------------------------------------------
   Formatting + display helpers
   --------------------------------------------------------------------------- */

/** Return empty string as prices are removed. */
export function formatPrice(amount) {
  return '';
}

/** Return only unit information. */
export function formatUnitPrice(amount, unit) {
  return unit ? `per ${unit}` : '';
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
