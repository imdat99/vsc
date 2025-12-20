"use client";

import { useHead, UseHeadInput, UseHeadOptions } from "@unhead/vue";
import { defineComponent, Fragment, toRef, watch } from "vue";
interface VueHeadProps {
	input: UseHeadInput;
	options?: UseHeadOptions;
}
export const VueHead = defineComponent<VueHeadProps>({
	name: "VueHead",
	props: ["input", "options"],
	setup(props) {
		useHead(toRef(props, "input") as any, props.options);
		return () => null;
	}
});
