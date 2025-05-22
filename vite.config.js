import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  assetsInclude: ['**/*.typeface.json', '**/*.ktx2'], // Treat .typeface.json as assets
  base: '/', // Ensure correct base path for assets
});