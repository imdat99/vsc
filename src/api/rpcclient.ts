import {
	proxyTinyRpc,
	TinyRpcClientAdapter,
	TinyRpcError,
} from "@hiogawa/tiny-rpc";
import type { RpcRoutes } from "./rpc";
import { Result } from "@hiogawa/utils";
declare let __host__: string;
const endpoint = "/rpc";
const url = import.meta.env.SSR ? "http://localhost" : "";
const headers: Record<string, string> = {}; // inject headers to demonstrate context
export const client = proxyTinyRpc<RpcRoutes>({
	adapter: httpClientAdapter({
		url: url + endpoint,
		pathsForGET: [],
	}),
});
const GET_PAYLOAD_PARAM = "payload";
function httpClientAdapter(opts: {
	url: string;
	pathsForGET?: string[];
}): TinyRpcClientAdapter {
	return {
		send: async (data) => {
			const url = [opts.url, data.path].join("/");
			const payload = JSON.stringify(data.args);
			const method = opts.pathsForGET?.includes(data.path)
				? "GET"
				: "POST";
			let req: Request;
			if (method === "GET") {
				req = new Request(
					url +
						"?" +
						new URLSearchParams({ [GET_PAYLOAD_PARAM]: payload })
				);
			} else {
				req = new Request(url, {
					method: "POST",
					body: payload,
					headers: {
						"content-type": "application/json; charset=utf-8",
					},
					credentials: "include",
				});
			}
			let res: Response;
			if (import.meta.env.SSR) {
				const { getContext } = await import("hono/context-storage");
				const c = getContext<any>();
				Object.entries(c.req.header()).forEach(([k, v]) => {
					req.headers.append(k, v);
				});
				res = await c.get("fetch")(req);
			} else {
				res = await fetch(req);
			}
			if (!res.ok) {
				// throw new Error(`HTTP error: ${res.status}`);
				throw new Error(
					JSON.stringify({
						status: res.status,
						statusText: res.statusText,
						data: { message: await res.text() },
						internal: true,
					})
				);
				// throw TinyRpcError.deserialize(res.status);
			}
			const result: Result<unknown, unknown> = JSON.parse(
				await res.text()
			);
			if (!result.ok) {
				throw TinyRpcError.deserialize(result.value);
			}
			return result.value;
		},
	};
}
