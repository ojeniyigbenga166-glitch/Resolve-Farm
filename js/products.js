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
  { id: 'tomatoes', name: 'Tomatoes',      description: 'Vine-ripened and sauce-ready.' },
  { id: 'peppers',  name: 'Peppers',       description: 'From sweet bells to serious heat.' },
  { id: 'corn',     name: 'Corn',          description: 'Sweet cobs, harvested in season.' },
  { id: 'other',    name: 'Other Produce', description: 'The rest of the harvest.' }
];

const PRODUCTS = [
  {
    id: 'p-001',
    slug: 'fresh-tomatoes',
    name: 'Fresh Tomatoes',
    category: 'tomatoes',
    shortDescription: 'Premium vine-ripened fresh tomatoes.',
    description: 'Our flagship tomatoes are left on the vine until they are fully coloured, then hand-picked the same morning they ship. The result is a deep, sweet flavour and a firm skin that holds up in a salad or on a sandwich.',
    highlights: [
      'Ripened on the vine, never gas-ripened',
      'Hand-picked the morning of dispatch',
      'Grown in Essex County soil at our Maidstone farm'
    ],
    image: '/assets/images/produce/fresh-tomatoes.webp',
    gallery: [
      '/assets/images/gallery/greenhouse-tomatoes.webp',
      '/assets/images/gallery/farmer-harvest.webp'
    ],
    unit: 'lb',
    availability: 'in-stock',
    stock: 120,
    featured: true,
    badge: 'Best Seller',
    tags: ['tomato', 'salad', 'vine ripened', 'fresh']
  },
  {
    id: 'p-002',
    slug: 'roma-tomatoes',
    name: 'Roma Tomatoes',
    category: 'tomatoes',
    shortDescription: 'Perfect for sauces and canning.',
    description: 'Roma tomatoes are dense, low in seed and low in water, which makes them the variety to reach for when you are reducing a sauce or filling jars for the winter. They cook down fast without going watery.',
    highlights: [
      'Meaty, low-moisture flesh built for cooking',
      'Ideal for passata, paste and canning',
      'Sold by the pound so you can buy batch quantities'
    ],
    image: '/assets/images/gallery/greenhouse-tomatoes.webp',
    gallery: [
      '/assets/images/produce/fresh-tomatoes.webp',
      '/assets/images/gallery/fresh-market.webp'
    ],
    unit: 'lb',
    availability: 'in-stock',
    stock: 90,
    featured: true,
    badge: '',
    tags: ['tomato', 'roma', 'plum', 'sauce', 'canning', 'cooking']
  },
  {
    id: 'p-003',
    slug: 'bell-pepper',
    name: 'Pepper',
    category: 'peppers',
    shortDescription: 'Fresh and crisp bell peppers.',
    description: 'Thick-walled sweet bell peppers with a clean snap and no heat at all. Good raw in a crudite platter, and sturdy enough to roast, stuff or grill without collapsing.',
    highlights: [
      'No heat - sweet and mild',
      'Thick walls, ideal for roasting and stuffing',
      'Picked at full colour for maximum sweetness'
    ],
    image: '/assets/images/gallery/bell-peppers.webp',
    gallery: [
      '/assets/images/produce/peppers.webp',
      '/assets/images/produce/peppers-harvest-top.webp'
    ],
    unit: 'lb',
    availability: 'in-stock',
    stock: 140,
    featured: false,
    badge: '',
    tags: ['pepper', 'bell', 'sweet', 'mild', 'capsicum']
  },
  {
    id: 'p-004',
    slug: 'habanero',
    name: 'Habanero',
    category: 'peppers',
    shortDescription: 'Spicy habanero peppers for authentic flavor.',
    description: 'Seriously hot, but the heat arrives behind a distinctly fruity, almost citrus top note - which is why habanero is the backbone of West African and Caribbean cooking rather than just a novelty. Handle with gloves.',
    highlights: [
      'Intense heat with a fruity, citrus finish',
      'The variety for jollof, pepper soup and hot sauce',
      'Grown from seed on our own beds'
    ],
    image: '/assets/images/produce/fresh-peppers.jpg',
    gallery: [
      '/assets/images/produce/peppers-harvest-field.webp',
      '/assets/images/gallery/farmer-harvest.webp'
    ],
    unit: 'lb',
    availability: 'in-stock',
    stock: 45,
    featured: false,
    badge: 'Very Hot',
    tags: ['pepper', 'habanero', 'hot', 'spicy', 'chilli', 'chili', 'scotch bonnet']
  },
  {
    id: 'p-005',
    slug: 'crimson-hot',
    name: 'Crimson Hot',
    category: 'peppers',
    shortDescription: 'Flavorful crimson hot peppers.',
    description: 'A deep red chilli that sits in the middle of the heat range - hot enough to notice, mild enough to use generously. Excellent fresh, and it dries and flakes beautifully.',
    highlights: [
      'Medium heat, big flavour',
      'Dries well for flakes and powder',
      'Deep crimson colour that holds after cooking'
    ],
    image: '/assets/images/produce/peppers-harvest-top.webp',
    gallery: [
      '/assets/images/produce/peppers.webp',
      '/assets/images/produce/peppers-harvest-field.webp'
    ],
    unit: 'lb',
    availability: 'in-stock',
    stock: 60,
    featured: false,
    badge: '',
    tags: ['pepper', 'crimson', 'hot', 'red', 'chilli', 'chili', 'medium heat']
  },
  {
    id: 'p-006',
    slug: 'cayenne-pepper',
    name: 'Cayenne Pepper',
    category: 'peppers',
    shortDescription: 'Fresh cayenne peppers.',
    description: 'Long, slender and reliably sharp. Cayenne is the workhorse chilli - clean heat without a strong flavour of its own, so it lifts a dish instead of taking it over. Sold fresh, not ground.',
    highlights: [
      'Clean, straightforward heat',
      'Sold fresh rather than ground',
      'Freezes and dries without losing potency'
    ],
    image: '/assets/images/produce/peppers-harvest-field.webp',
    gallery: [
      '/assets/images/produce/peppers.webp',
      '/assets/images/gallery/bell-peppers.webp'
    ],
    unit: 'lb',
    availability: 'in-stock',
    stock: 75,
    featured: false,
    badge: '',
    tags: ['pepper', 'cayenne', 'hot', 'spicy', 'chilli', 'chili', 'fresh']
  },
  {
    id: 'p-007',
    slug: 'african-corn-agbado-naija',
    name: 'African Corn — Agbado Naija',
    category: 'corn',
    shortDescription: 'Authentic African corn.',
    description: 'The starchy, full-flavoured field corn used across West African kitchens - firmer and far less sugary than North American sweetcorn, which is exactly what makes it right for boiling, roasting over coals, or grinding. Grown in limited quantity and strictly seasonal.',
    highlights: [
      'Traditional West African variety, grown in Ontario',
      'Starchy and firm - built for boiling, roasting or milling',
      'Seasonal harvest, limited quantity'
    ],
    image: '/assets/images/produce/african-corn.webp',
    gallery: [
      '/assets/images/gallery/fresh-market.webp',
      '/assets/images/farm/farm-family-planting.webp'
    ],
    unit: 'dozen',
    availability: 'seasonal',
    stock: 30,
    featured: true,
    badge: 'Seasonal',
    tags: ['corn', 'agbado', 'african', 'maize', 'naija', 'seasonal']
  }
];

export { PRODUCTS, CATEGORIES };
