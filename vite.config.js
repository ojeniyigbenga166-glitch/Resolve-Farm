import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'pages/about.html'),
        contact: resolve(__dirname, 'pages/contact.html'),
        farm: resolve(__dirname, 'pages/farm.html'),
        gallery: resolve(__dirname, 'pages/gallery.html'),
        produce: resolve(__dirname, 'pages/produce.html'),
      },
    },
  },
});
