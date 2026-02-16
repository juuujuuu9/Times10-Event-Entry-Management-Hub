// @ts-check
import { defineConfig } from 'astro/config';
import path from 'path';
import { fileURLToPath } from 'url';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import authAstro from 'auth-astro';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  // Disable Astro's origin check on Vercel — it blocks auth POSTs due to serverless URL/origin mismatch.
  // Auth.js has its own CSRF protection for OAuth.
  security: { checkOrigin: false },
  integrations: [react(), authAstro()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  },

  adapter: vercel(),
});