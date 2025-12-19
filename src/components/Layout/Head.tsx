"use client";

import { useHead, UseHeadInput, UseHeadOptions } from "@unhead/vue";
import { defineComponent, Fragment, toRef } from "vue";

export const VueHead = defineComponent<{
    input: UseHeadInput,
    options?: UseHeadOptions,
}>((props, { slots }) => {
    console.log("Head props:", toRef(props.input));
    // useHead(props.input, props.options);
    return () => <div>{String((props.input as any).title)}</div>
},
    {
        name: "VueHead",
        props: ["input", "options"],
    }
);