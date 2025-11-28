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
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "src/server.entry.tsx",
      preview: path.resolve("dist/server/index.js"),
    }),
    createVirtualPlugin("ssr-assets", async function () {
      const bootstrapModules: ManifestChunk[] = [];
      if (this.environment.mode === "dev") {
        bootstrapModules.push({
          file: "/@vite/client",
          isEntry: true,
          css: [],
          imports: [],
          dynamicImports: [],
          assets: [],
        },{
          file: "/src/client.entry.ts",
          isEntry: true,
          css: [],
        })
      }
      if (this.environment.mode === "build") {
        try {
          // this.fs.unlink("dist/public/index.html")
        } catch (e) {}
        const bundleFile = await this.fs
          .readFile("dist/public/.vite/manifest.json")
          .then((json) => {
            const clientManifest: Manifest = JSON.parse(json.toString());
            return Object.values(clientManifest).find((c) => c.isEntry);
          });
          bootstrapModules.push(bundleFile!);
      }
      return `export const bootstrapModules = ${JSON.stringify(
        bootstrapModules
      )}`;
    }),
  ],
  appType: "custom",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    manifest: true,
    outDir: env.isSsrBuild ? "dist/server" : "dist/public",
    minify: true,
    emptyOutDir: true,
    // ssr: env.isSsrBuild
  },
  //   builder: {
  //     sharedPlugins: true,
  //   }
}));
