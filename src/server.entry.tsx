import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import vueRenderer from './routes/_renderer';
// import { serveStatic } from "hono/bun";
import { showRoutes } from "hono/dev";
const app = new Hono<any>();
app.use(serveStatic({ root: "./public" }));
app.use(vueRenderer)
app.get('/', async (c) => {
  const home = await import('./routes/home.server.vue')
  return c.render(home as any);
});
app.get('/sfc', async (c) => {
  const home = await import('./routes/sfc/Page.server.vue')
  return c.render(home as any);
});
app.get("/.well-known/appspecific/com.chrome.devtools.json", async (c) => {
	return c.json({
		"name": "VSC Demo",
	});
});
// app.get("*", async (c) => {
// 	const url = new URL(c.req.url);
// 	const route = routes[url.pathname as "/"];
// 	let Slot = () => <div>Not Found</div>;
// 	if (route) {
// 		const Page = (await route()).default;
// 		Slot = () => <Page />;
// 	}
// 	const App = <LayoutRoot><Slot /></LayoutRoot>;


// 	if (url.searchParams.has("__serialize")) {
// 		const serverApp = createSSRApp(() => null);
// 		serverApp.provide("SERVER_REQUEST", { url });
// 		serverApp.provide(ssrContextKey, { modules: new Set() });
// 		c.header("Content-Type", "application/json; charset=UTF-8");
// 		c.header("Content-Encoding", "Identity");
// 		// c.header("Content-Type", "application/json; charset=UTF-8");
// 		c.header("Content-Disposition", 'attachment; filename="f.txt"');
// 		c.header("Cross-Origin-Opener-Policy", 'same-origin-allow-popups; report-to="gws"');
// 		return streamText(c, async (stream) => {
// 			await serialize(App, serverApp._context).then(r => stream.write(JSON.stringify(r)));
// 		});
// 	}
// 	const app = createSSRApp(App);
// 	const ctx = {};
// 	const appStream = renderToWebStream(app, ctx);
// 	return streamText(c, async (stream) => {
// 		c.header("Content-Type", "text/html; charset=UTF-8");
// 		c.header("Content-Encoding", "Identity");
// 		await stream.write("<!DOCTYPE html><html lang='en'><head>");
// 		await stream.write("<base href='" + url.origin + "'/>");
// 		// await renderSSRHead(head).then((headString) => stream.write(headString.headTags.replace(/\n/g, "")));
// 		await stream.write(`<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"rel="stylesheet"></link>`);
// 		await stream.write(buildBootstrapScript());
// 		await stream.write("</head><body class='font-sans bg-[#f9fafd] text-gray-800 antialiased flex flex-col'>");
// 		await stream.pipe(appStream);
// 		// let json = htmlEscape(JSON.stringify(Object.values(result)));
// 		let jsonCtx = htmlEscape(JSON.stringify(JSON.stringify(ctx)));
// 		// await stream.write(`<script>globalThis.__serialized=${json};</script>`);
// 		await stream.write(`<script>globalThis.__SSR_CONTEXT__=JSON.parse(${jsonCtx});</script>`);
// 		await stream.write("</body></html>");
// 	});
// });
// const routes = {
// 	"/": () => import("./routes/home.server.vue"),
// 	// "/highlight": () => import("./routes/highlight/page"),
// 	// "/slow": () => import("./routes/slow/page"),
// 	"/sfc": () => import("./routes/sfc/Page.server.vue"),
// };



// const Router = defineComponent<{ url: URL }>({
// 	props: ["url"],
// 	async setup(props) {
// 		return () => <Layout>{slot}</Layout>;
// 	}
// }
// ,
// {
// 	props: ["url"],
// },
// );

// https://github.com/remix-run/remix/blob/7f30f0bc976f0b97a020e81be33f90f68d4e527a/packages/remix-server-runtime/markup.ts#L7-L16
function htmlEscape(s: string) {
	return s.replace(ESCAPE_REGEX, (s) => ESCAPE_LOOKUP[s as "&"]);
}

const ESCAPE_LOOKUP = {
	"&": "\\u0026",
	">": "\\u003e",
	"<": "\\u003c",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029",
};

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;

showRoutes(app)
export default app

