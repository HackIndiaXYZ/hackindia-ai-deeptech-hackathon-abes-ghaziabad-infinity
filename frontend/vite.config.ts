// Disable the Cloudflare Workers plugin so the build produces
// a standard Node.js SSR output that Vercel can serve.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
});
