// import { jsxRenderer } from 'hono/jsx-renderer'
import type { Context, MiddlewareHandler } from 'hono';
// import type { Context, PropsForRenderer } from 'hono/'
import { serialize } from '@/integrations/serialize';
import { bootstrapModules } from "virtual:ssr-assets";
import { Component, createSSRApp, ssrContextKey } from 'vue';
import { jsx, PropsWithChildren } from 'hono/jsx';
import { Link, Script } from 'honox/server'
import { Fragment } from 'vue/jsx-runtime';
import LayoutRoot from '../components/Layout/Root';
import { renderToString } from 'vue/server-renderer';
// console.log((renderToString(jsx(Link, { href: "/app/style.css", rel: "stylesheet" }))));

// import { PropsForRenderer } from 'node_modules/hono/dist/types/context';

type PropsForRenderer = {
  Layout: VueComponent;
  [key: string]: any;
}

interface RendererOptions {
  stream?: boolean | Record<string, string>;
}

type VueComponent = Component | { __isFragment: true }


const createRenderer =
  (c: Context, Layout: VueComponent, component?: any, options?: RendererOptions) =>
    async (children: any, props: any) => {
      const url = new URL(c.req.url);
      const node = component ? await component({ Children: children, Layout, ...props }, c) : children
      const isVsc = c.req.header("x-vsc") === "true"
      if (isVsc) {
        const serverApp = createSSRApp(() => null);
        serverApp.provide(Symbol("RequestContext"), c);
        serverApp.provide(ssrContextKey, { modules: new Set() });
        c.header("Content-Type", "application/json; charset=UTF-8");
        c.header("Content-Encoding", "Identity");
        c.header("Content-Disposition", 'attachment; filename="f.txt"');
        c.header("Cross-Origin-Opener-Policy", 'same-origin-allow-popups; report-to="gws"');
        return c.html(JSON.stringify(await serialize(node, serverApp._context)));
      }

      if (options?.stream) {
        const module = await import('vue/server-renderer')
        const ssrApp = createSSRApp(node)
        ssrApp.provide(Symbol("RequestContext"), c)
        const stream = module.renderToWebStream(ssrApp)
        if (options.stream === true) {
          c.header('Transfer-Encoding', 'chunked')
          c.header('Content-Type', 'text/html; charset=UTF-8')
          c.header('Content-Encoding', 'Identity')
        } else {
          for (const [key, value] of Object.entries(options.stream)) {
            c.header(key, String(value))
          }
        }
        const streamBody = new ReadableStream({
          async start(controller) {
            const reader = stream.getReader();
            controller.enqueue("<!DOCTYPE html><html lang='en'><head><base href='" + url.origin + "'/>")
            controller.enqueue('<meta charset="utf-8" />')
            controller.enqueue('<meta name="viewport" content="width=device-width, initial-scale=1.0" />')
            controller.enqueue('<link rel="icon" href="/favicon.ico" />')
            // <Link href="/app/style.css" rel="stylesheet" />
            // <Script src="/app/client.ts" async />
            // console.log((jsx(Link, { href: "/app/style.css", rel: "stylesheet" })).toString());
            // controller.enqueue(Link({ href: "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css", rel: "stylesheet" })?.toString())
            // controller.enqueue(Script({ src: "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.js", async: true }).toString())
            controller.enqueue(`<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"rel="stylesheet"></link>`);
            // await renderToString(<Fragment >
            //   <Link href="/src/style.css" rel="stylesheet" />
            //   <Script src="/src/client.entry.tsx" async />
            // </Fragment>).then((html) => {
            //   controller.enqueue(html)
            // })
            controller.enqueue(buildBootstrapScript());
            controller.enqueue('</head><body class="bg-white text-gray-900 font-sans antialiased overflow-x-hidden">')
            try {
              while (true) {
                const isDone = await reader.read().then(({ done, value }) => {
                  if (done) {
                    return true;
                  }
                  controller.enqueue(value);
                });
                if (isDone) {
                  controller.enqueue('</body></html>');
                  break;
                }
              }
            } finally {
              controller.close();
              reader.releaseLock();
            }
          }
        });

        return c.body(streamBody)
      } else {
        return c.html("Not support static render yet")
      }
    }
const vueRenderer = (
  component?: (props: PropsWithChildren<PropsForRenderer & {
    Layout: VueComponent;
  }>, c: Context) => any | Promise<any>,
  options?: RendererOptions
): MiddlewareHandler =>
  function vueRenderer(c, next) {
    const Layout = c.getLayout() ?? Fragment
    if (component) {
      console.log("set renderer with layout", Layout)
      c.setLayout((props) => {
        return component({ ...props, Layout }, c)
      })
    }
    // console.log("create renderer", Layout, component(), options)
    c.setRenderer(createRenderer(c, Layout as VueComponent, component, options) as any)
    return next()
  }
export default vueRenderer(({ Children }, c) => {
  // console.log("children", children)
  return <LayoutRoot><Children /></LayoutRoot>;
}, { stream: true })

/**
 * buildBootstrapScript, if isEntry is true, build script and link tags for bootstrap else is preload tags
 * @param chunks vite manifest chunks
 * @returns bootstrap script string <script>...</script>, <link>...</link> tags, preloaded as needed
 */
function buildBootstrapScript() {
  let script = "";
  let styles = "";
  bootstrapModules.forEach((chunk) => {
    if (chunk.isEntry) {
      script += `<script type="module" src="/${chunk.file}"></script>`;
      (chunk.css || []).forEach((cssFile) => {
        styles += `<link rel="stylesheet" crossorigin href="/${cssFile}">`;
      });
    } else {
      script += `<link rel="modulepreload" href="/${chunk.file}">`;
      (chunk.css || []).forEach((cssFile) => {
        styles += `<link rel="preload" as="style" href="/${cssFile}">`;
      });
    }
  });
  return styles + script;
}