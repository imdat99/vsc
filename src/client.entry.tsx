import "./style.css";
import { tinyassert } from "@hiogawa/utils";
import {
	createSSRApp,
	defineComponent,
	provide,
	readonly,
	shallowRef,
} from "vue";
import { type SerializeResult, deserialize } from "./integrations/serialize";
import { createReferenceMap } from "./integrations/client-reference/runtime";
import { listenBrowserHistory } from "./integrations/router/browser";
// import { ssrRegisterHelper } from "/__vue-jsx-ssr-register-helper"
async function main() {
	if (window.location.search.includes("__nojs")) {
		return;
	}

	let initResult = (globalThis as any).__serialized;
	const initReferenceMap = await createReferenceMap(initResult[1]);
	const initRender = () => deserialize(initResult[0], initReferenceMap);

	const Root = defineComponent(() => {
		const render = shallowRef(initRender);
		const isLoading = shallowRef(false);
		provide("isLoading", readonly(isLoading));

		const navManager = new AsyncTaskManager<() => void>({
			onSucess: (result) => {
				render.value = result;
				isLoading.value = false;
			},
		});

		listenBrowserHistory(() => {
			isLoading.value = true;
			navManager.push(async () => {
				const url = new URL(window.location.href);
				url.searchParams.set("__serialize", "");
				const res = await fetch(url);
				tinyassert(res.ok);
				const result = await res.text().then((t) => JSON.parse(t.slice(4)));
				const referenceMap = await createReferenceMap(result[1]);
				return () => deserialize(result[0], referenceMap);
			});
		});

		return () => render.value() as any;
	});

	const app = createSSRApp(Root);
	
	// const el = document.getElementById("root");
	// tinyassert(el);

	listenHydrationMismatch(() => {
		document.title = "🚨 HYDRATE ERROR";
	});
	app.mount("body", true);
	// clean up
	initResult = undefined;
	(window as any).__serialized = undefined;
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
	) {}

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
