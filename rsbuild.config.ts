import { getImageUrl, getProfile } from "./src/lib/social";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { TanStackRouterRspack } from "@tanstack/router-plugin/rspack";
import { normalizeText } from "normalize-text";
import bosConfig from "./bos.config.json";

export default async () => {
  const profile = await getProfile(bosConfig.account);
  const image = getImageUrl(profile?.image);
  const metadataImage = getImageUrl(profile?.backgroundImage);

  return defineConfig({
    html: {
      template: "./index.html",
      title: profile?.name,
      meta: {
        description: profile?.description || "",
        // Facebook/Meta
        "og:image": `${metadataImage}#og`,
        "og:image:width": "1200",
        "og:image:height": "630",
        // Twitter
        "twitter:image": `${metadataImage}#twitter`,
        "twitter:card": "summary_large_image",
        // LinkedIn
        "linkedin:image": `${metadataImage}#linkedin`,
      },
      favicon: image,
      inject: "body",
    },
    source: {
      entry: {
        index: "./src/index.tsx",
      },
      define: {
        "process.env.OPEN_CROSSPOST_PROXY_API": JSON.stringify(
          process.env.OPEN_CROSSPOST_PROXY_API,
        ),
      },
    },
    server: {
      port: 5170,
    },
    output: {
      distPath: {
        root: "dist",
      },
      cleanDistPath: true,
      assetPrefix: ".",
    },
    tools: {
      rspack: {
        plugins: [
          TanStackRouterRspack({
            routesDirectory: "./src/routes",
            enableRouteGeneration: true,
          }),
        ],
        module: {
          rules: [
            {
              test: new RegExp(image),
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 32 * 1024,
                },
              },
              generator: {
                filename: "favicon.[hash][ext]",
                sizes: [32],
              },
            },
            {
              test: new RegExp(image),
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 64 * 1024,
                },
              },
              generator: {
                filename: "logo.[hash][ext]",
                sizes: [80], // 80x80 for the w-20 h-20 logo div
              },
            },
            // Facebook/Meta (1200x630)
            {
              test: new RegExp(`${metadataImage}#og`),
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 256 * 1024,
                },
              },
              generator: {
                filename: "og-image.[hash][ext]",
                sizes: [1200],
              },
            },
            // Twitter (1200x675)
            {
              test: new RegExp(`${metadataImage}#twitter`),
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 256 * 1024,
                },
              },
              generator: {
                filename: "twitter-image.[hash][ext]",
                sizes: [1200],
              },
            },
            // LinkedIn (1200x627)
            {
              test: new RegExp(`${metadataImage}#linkedin`),
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 256 * 1024,
                },
              },
              generator: {
                filename: "linkedin-image.[hash][ext]",
                sizes: [1200],
              },
            },
          ],
        },
      },
    },
    plugins: [
      pluginReact(),
      pluginNodePolyfill(),
      // pluginModuleFederation({
      //   name: "www",
      //   remotes: {
      //     profile:
      //       "profile@https://unpkg.com/@near-everything/profile@latest/dist/profile/remoteEntry.js",
      //   },
      //   experiments: {
      //     federationRuntime: "hoisted",
      //   },
      //   shared: {
      //     react: { singleton: true, eager: true, requiredVersion: "^18.0.0" },
      //     "react-dom": {
      //       singleton: true,
      //       eager: true,
      //       requiredVersion: "^18.0.0",
      //     },
      //     "@tanstack/react-router": { singleton: true, eager: true },
      //   },
      // }),
    ],
  });
};
