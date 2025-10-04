/* eslint-disable import/no-extraneous-dependencies */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  // Use '/' for local dev, '/habitchain-2/' for production build
  base: process.env.NODE_ENV === 'production' ? '/habitchain-2/' : '/',
  // alias are only to be added when absolutely necessary, these modules are already present in the browser environment
  // resolve: {
  // alias: {
  // crypto: "crypto-browserify",
  // assert: "assert",
  // http: "stream-http",
  // https: "https-browserify",
  // url: "url",
  // zlib: "browserify-zlib",
  // stream: "stream-browserify",
  // },
  // },
  define: {
    global: "globalThis",
  },
});