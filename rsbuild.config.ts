import { getImageUrl, getProfile } from "./src/lib/utils/near-social-node";
// import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";
import bos from "./bos.config.json";

type Network = "mainnet" | "testnet" | "localnet";

const network: Network = bos.network as Network;

const isProduction = process.env.NODE_ENV === "production";
const isStaging = process.env.NODE_ENV === "staging";

export default async () => {
  const profile = await getProfile(bos.account);
  const image = getImageUrl(profile?.image);
  const metadataImage = getImageUrl(profile?.backgroundImage);

  return defineConfig({
    html: {
      template: "./index.html",
      templateParameters: {
        // Metadata tags
        title: profile?.name || bos.account,
        description: profile?.description || "",
        ogImage: `${metadataImage}#og`,
        twitterImage: `${metadataImage}#twitter`,
        linkedinImage: `${metadataImage}#linkedin`,
        favicon: image,
        // near
        networkId: network,
        fastintear:
          isProduction || isStaging
            ? "https://unpkg.com/fastintear@latest/dist/umd/browser.global.js"
            : "/fastintear/dist/umd/browser.global.js",
      },
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
      historyApiFallback: true,
      publicDir: {
        name: "node_modules",
        watch: false,
      },
    },
    output: {
      distPath: {
        root: "dist",
      },
      cleanDistPath: true,
      assetPrefix: "/",
    },
    tools: {
      rspack: {
        // Workaround
        externals: {
          "@rspack/binding-linux-x64-musl/rspack.linux-x64-musl.node":
            "commonjs @rspack/binding-linux-x64-musl/rspack.linux-x64-musl.node",
          "@rspack/binding-linux-x64-gnu/rspack.linux-x64-gnu.node ":
            "commonjs @rspack/binding-linux-x64-gnu/rspack.linux-x64-gnu.node",
        },
        plugins: [
          tanstackRouter({
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
