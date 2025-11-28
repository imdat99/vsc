import { createSSRApp, defineComponent, ssrContextKey } from "vue";
import { renderToString, renderToWebStream } from "vue/server-renderer";
import { createReferenceMap } from "./integrations/client-reference/runtime";
import { deserialize, serialize } from "./integrations/serialize";
import { Hono } from "hono";
import { serveStatic } from '@hono/node-server/serve-static';
import { streamText } from "hono/streaming";
import { bootstrapModules } from "virtual:ssr-assets";
import "uno.css";

// import { serveStatic } from "hono/bun";
import LayoutRoot from "./components/Layout/Root";
const app = new Hono<any>();
app.use(serveStatic({ root: "./public" }));
app.get("/.well-known/appspecific/com.chrome.devtools.json", async (c) => {
	return c.json({
		"name": "VSC Demo",
	});
});
app.get("*", async (c) => {
	const url = new URL(c.req.url);
	const route = routes[url.pathname as "/"];
	let Slot = () => <div>Not Found</div>;
	if (route) {
			const Page = (await route()).default;
			Slot = () => <Page />;
	}
	const serverApp = createSSRApp(() => null);
	serverApp.provide("SERVER_REQUEST", { url });
	serverApp.provide(ssrContextKey, { modules: new Set() });
	const result = await serialize(<LayoutRoot><Slot /></LayoutRoot>, serverApp._context);

	if (url.searchParams.has("__serialize")) {
		return new Response(")]}'\n"+JSON.stringify(Object.values(result)), {
			headers: {
				"content-type": "application/json; charset=UTF-8",
				"content-disposition": 'attachment; filename="f.txt"',
				"cross-origin-opener-policy": 'same-origin-allow-popups; report-to="gws"',
			},
		});
	}

	const referenceMap = await createReferenceMap(result.referenceIds);
	console.log("initReferenceMap", result.referenceIds);
	
	const Root = () => deserialize(result.data, referenceMap);
	const app = createSSRApp(Root);
	const ctx = {};
	const appStream = renderToWebStream(app, ctx);
	// let html = (await import("virtual:index-html" as string)).default as string;
	// html = html.replace("<body>", () => `<body><div id="root">${ssrHtml}</div>`);
	// html = html.replace(
	// 	"<head>",
	// 	() =>
	// 		`<head><script>globalThis.__serialized = ${escpaeScriptString(
	// 			JSON.stringify(result),
	// 		)}</script>`,
	// );
	// if (import.meta.env.DEV) {
	// 	html = html.replace(
	// 		"<head>",
	// 		`<head><link rel="stylesheet" href="/src/demo/style.css?direct" />`,
	// 	);
	// }
	// return new Response(html, {
	// 	headers: {
	// 		"content-type": "text/html",
	// 	},
	// });
	return streamText(c, async (stream) => {
		c.header("Content-Type", "text/html; charset=UTF-8");
		c.header("Content-Encoding", "Identity");
		await stream.write("<!DOCTYPE html><html lang='en'><head>");
		await stream.write("<base href='" + url.origin + "'/>");
		// await renderSSRHead(head).then((headString) => stream.write(headString.headTags.replace(/\n/g, "")));
		await stream.write(`<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"rel="stylesheet"></link>`);
		await stream.write(buildBootstrapScript());
		await stream.write("</head><body class='font-sans bg-[#f9fafd] text-gray-800 antialiased flex flex-col'>");
		await stream.pipe(appStream);
		let json = htmlEscape(JSON.stringify(JSON.stringify(Object.values(result))));
		let jsonCtx = htmlEscape(JSON.stringify(JSON.stringify(ctx)));
		await stream.write(`<script>globalThis.__serialized=JSON.parse(${json});</script>`);
		await stream.write(`<script>globalThis.__SSR_CONTEXT__=JSON.parse(${jsonCtx});</script>`);
		await stream.write("</body></html>");
	});
});
const routes = {
	"/": () => import("./routes/home.server.vue"),
	// "/highlight": () => import("./routes/highlight/page"),
	// "/slow": () => import("./routes/slow/page"),
	"/sfc": () => import("./routes/sfc/Page.server.vue"),
};



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

export default app
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
	return styles+script;
}