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
        // Deliberately NOT listing recharts here. Naming it as a manual chunk
        // pins it to the entry's preload set, so the browser fetched all 545KB
        // on the first visit even though nothing on the public site uses it.
        // Left alone, Rollup puts it inside the lazily loaded chart chunk.
        manualChunks: {
          react: ["react", "react-dom"],
          icons: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
