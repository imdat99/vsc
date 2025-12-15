"use client";

import { useRequestContext } from "@/lib/hooks/useRequestContext";
import { tinyassert } from "@hiogawa/utils";
import { defineComponent, ref, onMounted, onUnmounted, computed } from "vue";

function useLocation() {
    if (typeof window === "undefined") {
		const ctx = useRequestContext();
		return ref(ctx ? new URL(ctx.req.url).pathname : "/");
    }
	const path = ref(window.location.pathname);

	const update = () => {
		path.value = window.location.pathname;
	};

	onMounted(() => {
		window.addEventListener("popstate", update);
	});

	onUnmounted(() => {
		window.removeEventListener("popstate", update);
	});

	return path;
}

export const Link = defineComponent<{
	href: string;
	activeClass?: string;
	exactActiveClass?: string;
	class?: string;
}>(
	(props, { slots }) => {
		const currentPath = useLocation();
		const isExactActive = computed(
			() => currentPath.value === props.href
		);
		const isActive = computed(
			() =>
				currentPath.value === props.href ||
				currentPath.value.startsWith(("/" +props.href + "/").replace(/\/+/g, "/"))
		);

		const className = computed(() => ({
			[props.activeClass ?? ""]: isActive.value,
			[props.exactActiveClass ?? ""]: isExactActive.value,
			[props.class ?? ""]: true,
		}));

		const navigate = (e: MouseEvent) => {
			if (
				e.currentTarget instanceof HTMLAnchorElement &&
				e.button === 0 &&
				!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
				(!e.currentTarget.target || e.currentTarget.target === "_self")
			) {
				e.preventDefault();
				history.pushState(null, "", props.href);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}
		};

		return () => (
			<a href={props.href} class={className.value} onClick={navigate}>
				{/*slots.default?.()*/}
				{
					isActive.value ? (slots.active ? slots.active() : isExactActive.value ? slots.exact ? slots.exact() : slots.default?.() : slots.default?.()) : slots.default?.()
				}
			</a>
		);
	},
	{
		props: ["href", "activeClass", "exactActiveClass", "class"],
	}
);


export const Form = defineComponent<{ replace?: boolean }>(
	(props, { slots }) => {
		return () => (
			<form
				onSubmit={(e) => {
					e.preventDefault();
					tinyassert(e.currentTarget instanceof HTMLFormElement);
					const url = new URL(e.currentTarget.action);
					const data = new FormData(e.currentTarget);
					data.forEach((v, k) => {
						if (typeof v === "string") {
							url.searchParams.set(k, v);
						}
					});
					if (props.replace) {
						history.replaceState({}, "", url);
					} else {
						history.pushState({}, "", url);
					}
				}}
			>
				{slots.default?.()}
			</form>
		);
	},
	{
		props: ["replace"],
	},
);
