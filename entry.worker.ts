import { Handler, Hono } from "hono";
type Bindings = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

interface RedisVariables {
  validatedData?: any;
}
const app = new Hono<{ Bindings: Bindings, Variables: RedisVariables }>()
const applyMiddlewareToPaths = (paths: string[], ...middleware: Handler[]) => {
	for (const path of paths) {
		app.use(path, ...middleware)
	}
}
const middlewares: Handler[] = [
	async (c, next) => {
		await next();
		if (c.res.status === 200) {
			c.res.headers.set("Cache-Control", "public, max-age=31536000");
		}
	},
	// serveStatic({
	// 	root: "dist/client",
	// })
]
applyMiddlewareToPaths(["/static/*", "/assets/*", "/locales/*", "/site.webmanifest"], ...middlewares);
import("./dist/server/index").then((mod) => mod.default).then(
  (module) => {
	// console.log("Worker started", module);
    app.all("*",...middlewares, async (c) => module.fetch(c.req.raw));
  }
);
export default app;