import { defineComponent, ref } from "vue";
import Header from "./Header.server.vue";
import { Link } from "@/integrations/router/client";

export default defineComponent((_p, { slots }) => {
	const links = [
		{ href: "/", label: "Home" },
		{ href: "/dashboard", label: "Dashboard" },
		{ href: "/settings", label: "Settings" },
		{ href: "/sfc", label: "sfc" },
	]
	const count = ref(0);
	return () => (
		<>
			<Header num={100} />
			<main class="flex flex-1 overflow-hidden">
				<div class="flex-1 overflow-auto p-4 bg-white rounded-lg mr-2 mb-2 h-[calc(100vh-64px-16px)]">
					<div class="mb-4 border-b border-default">
						<ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="default-tab" data-tabs-toggle="#default-tab-content" role="tablist">
							{links.map(link => (
								<li class="me-2" key={link.href} role="presentation">
									<Link class="inline-block border-b-2 border-transparent p-4 rounded-t-base hover:(text-primary border-b-primary border-b-2)" href={link.href}>{link.label}</Link>
								</li>
							))}
						</ul>
					</div>
					{slots.default?.()}
				</div>
			</main>
		</>
	);
}, { name: "LayoutRoot" });
