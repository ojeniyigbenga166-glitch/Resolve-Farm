import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

const htmlFallbackPlugin = {
  name: 'html-ext-fallback',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url.split('?')[0]; // strip query parameters
      if (url.length > 1 && !url.includes('.')) {
        const filePath = resolve(import.meta.dirname, url.substring(1) + '.html');
        if (fs.existsSync(filePath)) {
          req.url = req.url.replace(url, url + '.html');
        }
      }
      next();
    });
  }
};

export default defineConfig({
  plugins: [htmlFallbackPlugin],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'pages/about.html'),
        contact: resolve(import.meta.dirname, 'pages/contact.html'),
        farm: resolve(import.meta.dirname, 'pages/farm.html'),
        gallery: resolve(import.meta.dirname, 'pages/gallery.html'),
        produce: resolve(import.meta.dirname, 'pages/produce.html'),
        shop: resolve(import.meta.dirname, 'pages/shop.html'),
        product: resolve(import.meta.dirname, 'pages/product.html'),
        cart: resolve(import.meta.dirname, 'pages/cart.html'),
        checkout: resolve(import.meta.dirname, 'pages/checkout.html'),
        orderConfirmation: resolve(import.meta.dirname, 'pages/order-confirmation.html'),
      },
    },
  },
});
