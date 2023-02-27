import { sveltekit } from "@sveltejs/kit/vite";
import type { UserConfig } from "vite";
import path from "path";
import stdLibBrowser from "node-stdlib-browser";
import { createRequire } from "module";
import inject from "@rollup/plugin-inject";

const require = createRequire(import.meta.url);
const shimPath = require.resolve('node-stdlib-browser/helpers/esbuild/shim')

const config: UserConfig = {
  plugins: [
    sveltekit(),
    {
      ...inject(
          Object.fromEntries(
              ['global', 'process', 'buffer'].map((module) => [module, [shimPath, module]]),
          ),
      ),
      enforce: 'post',
  },
  ],
  build: {
      sourcemap: true,
  },
  resolve: {
    alias: { ...stdLibBrowser, "svelte-schema-form": path.resolve("src/lib") },
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
};

export default config;
