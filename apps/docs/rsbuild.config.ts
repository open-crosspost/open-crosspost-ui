import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import TanStackRouterRspack from "@tanstack/router-plugin/rspack";

export default defineConfig({
  html: {
    template: "./index.html",
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
  },
  server: {
    port: 5171,
    historyApiFallback: true,
  },
  output: {
    distPath: {
      root: "dist",
    },
    cleanDistPath: true,
  },
  tools: {
    rspack: {
      plugins: [
        TanStackRouterRspack({
          routesDirectory: "./src/routes",
          enableRouteGeneration: false,
        }),
      ],
    },
  },
  plugins: [pluginReact()],
});

