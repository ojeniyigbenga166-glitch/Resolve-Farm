import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'pages/about.html'),
        contact: resolve(import.meta.dirname, 'pages/contact.html'),
        farm: resolve(import.meta.dirname, 'pages/farm.html'),
        gallery: resolve(import.meta.dirname, 'pages/gallery.html'),
        produce: resolve(import.meta.dirname, 'pages/produce.html'),
      },
    },
  },
});
