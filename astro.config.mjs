import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://swarmnest.ai',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
