import { Hono } from 'hono';
import vueRenderer from './routes/_renderer';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from "hono/cors";
// import { serveStatic } from "hono/bun";
import { showRoutes } from "hono/dev";
import { contextStorage } from 'hono/context-storage';
import { jwtRpc, rpcServer } from './api/rpc';
import isMobile from 'is-mobile';
const app = new Hono<any>();
app.use(cors(), async (c, next) => {
  c.set("fetch", app.request.bind(app));
  const ua = c.req.header("User-Agent")
  if (!ua) {
	return c.json({ error: "User-Agent header is missing" }, 400);
  };
   c.set("isMobile", isMobile({ ua }));
  await next();
}, contextStorage(), rpcServer);
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
app.notFound(async (c) => {
	return c.render(await import('./routes/_404.server.vue') as any);
});
app.get("/.well-known/appspecific/com.chrome.devtools.json", async (c) => {
	return c.json({
		"name": "VSC Demo",
	});
});


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
