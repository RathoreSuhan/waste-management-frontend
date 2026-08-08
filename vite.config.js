import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { fileURLToPath, URL } from "node:url"; // Modern Node.js URL utilities

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // '@' now points to src/
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    // Backend CORS only whitelists http://localhost:5173
    port: 5173,

    // Fail loudly instead of silently moving to 5174, which would
    // make every API call fail with a CORS error
    strictPort: true,
  },
});
