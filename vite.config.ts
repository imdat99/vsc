import path from "node:path";
import unocss from "unocss/vite";
import {
  defineConfig,
  type Manifest,
  type ManifestChunk
} from "vite";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "./plugins/vite-plugin-ssr-middleware";
import {
  createVirtualPlugin,
  vitePluginVueServer
} from "./plugins/vue-server";
// https://vite.dev/config/
// let browserManifest: Manifest;
export default defineConfig((env) => ({
  plugins: [
    // vue(),
    unocss(),
    vitePluginVueServer(),
    vitePluginSsrMiddleware({
      entry: "src/server.entry.tsx",
      preview: path.resolve("dist/server/index.js"),
    }),

    // createVirtualPlugin("ssr-assets", async function () {
    //   const bootstrapModules: ManifestChunk[] = [];
    //   if (this.environment.mode === "dev") {
    //     bootstrapModules.push({
    //       file: "/@vite/client",
    //       isEntry: true,
    //       css: [],
    //       imports: [],
    //       dynamicImports: [],
    //       assets: [],
    //     },{
    //       file: "/src/client.entry.ts",
    //       isEntry: true,
    //       css: [],
    //     })
    //   }
    //   if (this.environment.mode === "build") {
    //     try {
    //       // this.fs.unlink("dist/public/index.html")
    //     } catch (e) {}
    //     const bundleFile = await this.fs
    //       .readFile("dist/public/.vite/manifest.json")
    //       .then((json) => {
    //         const clientManifest: Manifest = JSON.parse(json.toString());
    //         return Object.values(clientManifest).find((c) => c.isEntry);
    //       });
    //       bootstrapModules.push(bundleFile!);
    //   }
    //   return `export const bootstrapModules = ${JSON.stringify(
    //     bootstrapModules
    //   )}`;
    // }),
  ],
  // appType: "custom",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  environments: {
    ssr: {
      build: {
        outDir: "dist/server",
        copyPublicDir: false,
        rollupOptions: {
          input: { index: "/src/server.entry.tsx" },
        },
      },
    },
    scan: {
      build: {
        outDir: "dist/scan",
        copyPublicDir: false,
        rollupOptions: {
          input: { index: "/src/server.entry.tsx" },
        },
      },
    },
    client: {
      build: {
        manifest: true,
        outDir: "dist/public",
        rollupOptions: {
          input: { index: "/src/client.entry.tsx" },
        },
      },
    },
  },
  builder: {
    sharedPlugins: true,
    async buildApp(builder) {
      await builder.build(builder.environments.scan); // pre-build for scan client references
      await builder.build(builder.environments.client);
      await builder.build(builder.environments.ssr); // post-build for emit client references
    },
  },
  build: {
    manifest: true,
    // outDir: env.isSsrBuild ? "dist/server" : "dist/public",
    minify: false,
    emptyOutDir: true,
    // ssr: env.isSsrBuild
  },
  //   builder: {
  //     sharedPlugins: true,
  //   }
}));
