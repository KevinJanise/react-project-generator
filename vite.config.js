import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      assets: "/src/assets",
      components: "/src/components",
      contexts: "/src/contexts",
      hooks: "/src/hooks",
      layouts: "/src/layouts",
      routes: "/src/routes",
      services: "/src/services",
      utils: "/src/utils",
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      "/proxy": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
