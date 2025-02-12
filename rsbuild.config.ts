import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { TanStackRouterRspack } from "@tanstack/router-plugin/rspack";
import bosConfig from './bos.config.json';

export default defineConfig({
  html: {
    template: "./index.html",
    title: bosConfig.metadata.name,
    meta: {
      description: bosConfig.metadata.description,
    },
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
  },
  server: {
    port: 5170,
  },
  output: {
    distPath: {
      root: "dist",
    },
  },
  tools: {
    rspack: {
      plugins: [
        TanStackRouterRspack({
          routesDirectory: "./src/routes",
          enableRouteGeneration: true,
        }),
      ],
    },
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "crosspost",
      filename: "main/remoteEntry.js", // branch
      exposes: {
        "./App": "./src/App.tsx",
      },
      experiments: {
        federationRuntime: "hoisted",
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: "^18.0.0" },
        "react-dom": {
          singleton: true,
          eager: true,
          requiredVersion: "^18.0.0",
        },
        "@tanstack/react-router": { singleton: true, eager: true },
      },
    }),
  ],
});
