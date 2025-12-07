import { tinyassert } from "@hiogawa/utils";
import {
	createSSRApp,
	defineComponent,
	provide,
	readonly,
	ref,
	shallowRef,
	watch,
} from "vue";
import { type SerializeResult, deserialize } from "./integrations/serialize";
import { createReferenceMap } from "./integrations/client-reference/runtime";
import { listenBrowserHistory } from "./integrations/router/browser";
import "uno.css";

// import { ssrRegisterHelper } from "/__vue-jsx-ssr-register-helper"
async function callServer() {
	const request = new Request(window.location.href, { method: "GET" });
	request.headers.set("x-vsc", "true");
	const res = await fetch(request);
	// tinyassert(res.ok);
	const result = await res.json()
	const referenceMap = await createReferenceMap(result[0].map((i: number) => [i, result[i]]));
	return () => deserialize(result, referenceMap);
}
async function main() {
	if (window.location.search.includes("__nojs")) {
		return;
	}

	// let initResult = (globalThis as any).__serialized;
	// const initReferenceMap = await createReferenceMap(initResult[1]);
	// const initRender = () => deserialize(initResult[0], initReferenceMap);
	const initRender = await callServer();
	const Root = defineComponent({
		name: "Root",
		setup() {
			const render = shallowRef(initRender);
			const currentUrl = ref(window.location.href);
			const isLoading = shallowRef(false);
			provide("isLoading", readonly(isLoading));

			const navManager = new AsyncTaskManager<() => void>({
				onSucess: (result) => {
					render.value = result;
					isLoading.value = false;
				},
			});
			listenBrowserHistory((_d, url) => {
				if (url === currentUrl.value) {
					return;
				}
				isLoading.value = true;
				currentUrl.value = url?.toString() || "";
				navManager.push(callServer);
			});

			return () => render.value() as any;
		}
	});

	const app = createSSRApp(Root);

	// const el = document.getElementById("root");
	// tinyassert(el);

	listenHydrationMismatch(() => {
		document.title = "🚨 HYDRATE ERROR";
	});
	app.mount("body", true);
	// clean up
	// initResult = undefined;
	// (window as any).__serialized = undefined;
	if (import.meta.hot) {
		import.meta.hot.on("vue-server:update", (e) => {
			console.log("[vue-server] hot update", e.file);
			window.history.replaceState({}, "", window.location.href);
		});
	}
}

// interruptible navigation
class AsyncTaskManager<T> {
	private latest?: () => Promise<T>;

	constructor(
		private options: {
			onSucess: (v: T) => void;
		},
	) { }

	push(task: () => Promise<T>) {
		this.latest = task;
		task().then((v) => {
			if (this.latest === task) {
				this.latest = undefined;
				this.options.onSucess(v);
			}
		});
	}
}

// patch console to notify hydration error
function listenHydrationMismatch(f: () => void) {
	const prev = console.error;
	console.error = function (...args) {
		if (
			typeof args[0] === "string" &&
			args[0].includes("Hydration completed but contains mismatches")
		) {
			f();
		}
		prev.apply(this, args);
	};
}

main();
