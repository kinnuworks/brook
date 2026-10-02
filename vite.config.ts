import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { apiDevServer } from "./scripts/vite-api-dev.ts";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiDevServer(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Brook — talk to your stream",
        short_name: "Brook",
        description:
          "A talking field coach for the OneAquaHealth citizen stream check. Voice or tap, in seven languages.",
        theme_color: "#216B8C",
        background_color: "#F4F8F9",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,webp,woff2,json}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith("openfreemap.org"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "map-tiles", expiration: { maxEntries: 600 } },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith("open-meteo.com"),
            handler: "NetworkFirst",
            options: { cacheName: "weather", networkTimeoutSeconds: 4 },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // MapLibre 6 loads its worker relative to its own file; pre-bundling would break that path.
  optimizeDeps: { exclude: ["maplibre-gl"] },
  worker: { format: "es" },
});
