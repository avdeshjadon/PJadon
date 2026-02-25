import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/cloudinary-api": {
        target: "https://api.cloudinary.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cloudinary-api/, ""),
        secure: true,
      },
    },
  },
});
