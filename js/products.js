/**
 * RESOLVEFARM - Product Catalogue (single source of truth)
 *
 * This module is the ONLY place product facts live. No UI file hardcodes a
 * product name, price or image. When the Admin Dashboard + database land, this
 * file is the single thing that gets replaced by an API response of the same
 * shape - every consumer goes through product-service.js and keeps working.
 *
 * Shape contract (keep in sync with the future `products` table):
 *   id               string   stable primary key
 *   slug             string   URL key used by /pages/product.html?slug=...
 *   name             string   display name
 *   category         string   must match a CATEGORIES[].id
 *   shortDescription string   one line, used on cards
 *   description      string   full paragraph, used on the detail page
 *   highlights       string[] bullet points on the detail page
 *   image            string   primary image (card + detail hero)
 *   gallery          string[] additional detail-page images
 *   unit             string   'lb' | 'dozen' | ...
 *   availability     string   'in-stock' | 'seasonal' | 'out-of-stock'
 *   stock            number    units on hand (caps the quantity picker)
 *   featured         boolean  surfaces in the "Farm Favourites" rail
 *   badge            string   optional ribbon text, '' for none
 *   tags             string[] free-text keywords, fed into search
 *
 * NOTE ON DATA QUALITY: prices are placeholders carried over from the original
 * data module and still need sign-off. Several pepper varieties reuse the same
 * generic pepper photography because per-variety shots do not exist in
 * /public/assets yet - swap `image`/`gallery` when real product shots arrive.
 */

/* Category tabs, in display order. The shop renders these from data and skips
   any category with zero products, so adding a product to 'other' is enough to
   make the "Other Produce" tab appear. */
const CATEGORIES = [
  { id: 'peppers',  name: 'Habanero Peppers', description: 'Fresh Habaneros in Baskets (Amper), Single Boxes & Double Boxes.' },
  { id: 'corn',     name: 'African Corn',     description: 'Traditional Agbado field corn, sold in bags.' }
];

const PRODUCTS = [
  {
    id: 'p-004',
    slug: 'habanero-basket',
    name: 'Habanero Pepper (Basket)',
    category: 'peppers',
    shortDescription: 'Spicy habanero peppers sold in baskets (Amper).',
    description: 'Seriously hot, fruity habanero peppers freshly harvested and packed in traditional farm baskets (Amper).',
    highlights: [
      'Sold in Basket (Amper)',
      'Intense heat with a fruity, citrus finish',
      'Essential for jollof, pepper soup and hot sauce'
    ],
    image: '/assets/images/produce/fresh-peppers.jpg',
    gallery: [
      '/assets/images/produce/peppers-harvest-field.webp',
      '/assets/images/gallery/farmer-harvest.webp'
    ],
    unit: 'Basket (Amper)',
    packagingOptions: [
      { id: 'basket-amper', name: 'Basket (Amper)', icon: '🧺' }
    ],
    availability: 'in-stock',
    stock: 45,
    featured: true,
    badge: 'Popular',
    tags: ['pepper', 'habanero', 'hot', 'spicy', 'amper', 'basket']
  },
  {
    id: 'p-004-single-box',
    slug: 'habanero-single-box',
    name: 'Habanero Pepper (Single Box)',
    category: 'peppers',
    shortDescription: 'Spicy habanero peppers sold in a Single Box.',
    description: 'Seriously hot habanero peppers freshly packed in a standard Single Box according to Canadian agricultural produce standards.',
    highlights: [
      'Sold as Single Box',
      'Intense heat with a fruity, citrus finish',
      'Ideal for restaurants, caterers, and home kitchens'
    ],
    image: '/assets/images/produce/harvest-habaneros.webp',
    gallery: [
      '/assets/images/produce/fresh-peppers.jpg',
      '/assets/images/produce/peppers-harvest-field.webp'
    ],
    unit: 'Single Box',
    packagingOptions: [
      { id: 'single-box', name: 'Single Box', icon: '📦' }
    ],
    availability: 'in-stock',
    stock: 50,
    featured: true,
    badge: 'Single Box',
    tags: ['pepper', 'habanero', 'hot', 'spicy', 'single box', 'box']
  },
  {
    id: 'p-004-double-box',
    slug: 'habanero-double-box',
    name: 'Habanero Pepper (Double Box)',
    category: 'peppers',
    shortDescription: 'Spicy habanero peppers sold in a Double Box.',
    description: 'Seriously hot habanero peppers packed in a large Double Box for bulk wholesale orders, catering, and food processing.',
    highlights: [
      'Sold as Double Box (Bulk Wholesale)',
      'Intense heat with a fruity, citrus finish',
      'Maximum value for large quantity buyers'
    ],
    image: '/assets/images/produce/fresh-peppers.jpg',
    gallery: [
      '/assets/images/produce/harvest-habaneros.webp',
      '/assets/images/produce/peppers-harvest-field.webp'
    ],
    unit: 'Double Box',
    packagingOptions: [
      { id: 'double-box', name: 'Double Box', icon: '📦📦' }
    ],
    availability: 'in-stock',
    stock: 40,
    featured: true,
    badge: 'Double Box',
    tags: ['pepper', 'habanero', 'hot', 'spicy', 'double box', 'bulk']
  },
  {
    id: 'p-007',
    slug: 'african-corn-agbado-naija',
    name: 'African Corn — Agbado Naija',
    category: 'corn',
    shortDescription: 'Authentic African corn sold in bags.',
    description: 'The starchy, full-flavoured field corn used across West African kitchens - firmer and far less sugary than North American sweetcorn. Sold in bags for home cooking, events, and commercial supply.',
    highlights: [
      'Sold in Standard Bags and Wholesale Bags',
      'Traditional West African variety, grown in Ontario',
      'Starchy and firm - built for boiling, roasting or milling'
    ],
    image: '/assets/images/produce/african-corn.webp',
    gallery: [
      '/assets/images/gallery/fresh-market.webp',
      '/assets/images/farm/farm-family-planting.webp'
    ],
    unit: 'Bags',
    packagingOptions: [
      { id: 'standard-bag', name: 'Standard Bag', icon: '🛍️' },
      { id: 'full-bag', name: 'Full Bag (Wholesale)', icon: '🌾' }
    ],
    availability: 'seasonal',
    stock: 30,
    featured: true,
    badge: 'Seasonal',
    tags: ['corn', 'agbado', 'african', 'maize', 'naija', 'seasonal', 'bag']
  }
];

export { PRODUCTS, CATEGORIES };

