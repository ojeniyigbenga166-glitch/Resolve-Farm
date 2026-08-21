/**
 * RESOLVEFARM - Main Application Entry
 * Responsible for application initialization and coordinating frontend modules.
 * CSS imports ensure Vite bundles all styles for the homepage entry point.
 */

// CSS imports – required for Vite to bundle homepage styles correctly
import '../css/style.css';
import '../css/responsive.css';
import '../css/animations.css';
import '../css/mobile-nav.css';

// JS modules for the homepage
import './animations.js';
import './testimonials.js';
import './navigation.js';
import './cart-badge.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('RESOLVEFARM Application Initialized');
});
