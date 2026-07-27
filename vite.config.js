import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split the libraries out of the application bundle. They change far
        // less often than our own code, so a browser that has visited before
        // keeps them cached across deploys instead of downloading everything
        // again. It also lets the browser fetch them in parallel.
        manualChunks: {
          react: ["react", "react-dom"],
          charts: ["recharts"],
          icons: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
