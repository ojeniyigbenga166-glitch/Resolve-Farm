/**
 * RESOLVEFARM - Products Data Module
 * Static product data structured for future e-commerce integration.
 */

const PRODUCTS = [
  {
    id: 'p-001',
    name: 'Fresh Tomatoes',
    category: 'produce',
    description: 'Premium vine-ripened fresh tomatoes.',
    image: 'assets/images/produce/fresh-tomatoes.jpg',
    price: 4.99, // Placeholder
    unit: 'lb',
    availability: 'in-stock',
    featured: true
  },
  {
    id: 'p-002',
    name: 'Roma Tomatoes',
    category: 'produce',
    description: 'Perfect for sauces and canning.',
    image: 'assets/images/produce/roma-tomatoes.jpg',
    price: 3.99, // Placeholder
    unit: 'lb',
    availability: 'in-stock',
    featured: true
  },
  {
    id: 'p-003',
    name: 'Pepper',
    category: 'produce',
    description: 'Fresh and crisp bell peppers.',
    image: 'assets/images/produce/pepper.jpg',
    price: 5.99, // Placeholder
    unit: 'lb',
    availability: 'in-stock',
    featured: false
  },
  {
    id: 'p-004',
    name: 'Habanero',
    category: 'produce',
    description: 'Spicy habanero peppers for authentic flavor.',
    image: 'assets/images/produce/habanero.jpg',
    price: 8.99, // Placeholder
    unit: 'lb',
    availability: 'in-stock',
    featured: false
  },
  {
    id: 'p-005',
    name: 'Crimson Hot',
    category: 'produce',
    description: 'Flavorful crimson hot peppers.',
    image: 'assets/images/produce/crimson-hot.jpg',
    price: 7.99, // Placeholder
    unit: 'lb',
    availability: 'in-stock',
    featured: false
  },
  {
    id: 'p-006',
    name: 'Cayenne Pepper',
    category: 'produce',
    description: 'Fresh cayenne peppers.',
    image: 'assets/images/produce/cayenne.jpg',
    price: 6.99, // Placeholder
    unit: 'lb',
    availability: 'in-stock',
    featured: false
  },
  {
    id: 'p-007',
    name: 'African Corn — Agbado Naija',
    category: 'produce',
    description: 'Authentic African corn.',
    image: 'assets/images/produce/african-corn.jpg',
    price: 10.99, // Placeholder
    unit: 'dozen',
    availability: 'seasonal',
    featured: true
  }
];

export { PRODUCTS };
