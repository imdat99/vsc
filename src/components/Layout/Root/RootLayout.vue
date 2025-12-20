<script lang="ts" setup>
import { Link } from "@/integrations/router/client";
import { Search } from "@/components/icons";
import Home from "@/components/icons/Home.vue";
import HomeFilled from "@/components/icons/HomeFilled.vue";
import Layout from "@/components/icons/Layout.vue";
import LayoutFilled from "@/components/icons/LayoutFilled.vue";
import { createStaticVNode, inject, Ref, watch } from "vue";
import Add from "@/components/icons/Add.vue";
import AddFilled from "@/components/icons/AddFilled.vue";
import Bell from "@/components/icons/Bell.vue";
import BellFilled from "@/components/icons/BellFilled.vue";
import { isRouteLoading } from "@/lib/constants";

const className = ":uno: w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated"
const homeHoist = createStaticVNode(`<img class="h-8 w-8" src="/apple-touch-icon.png" alt="Logo" />`, 1);
const links = [
    { href: "/", label: "app", icon: homeHoist, exact: homeHoist, type: "a", exactClass: "" },
    { href: "/", label: "Home", icon: Home, exact: HomeFilled, type: "a", exactClass: 'bg-primary/10' },
    { href: "/search", label: "Search", icon: Search, exact: Search, type: "btn", exactClass: "" },
    { href: "/dashboard", label: "Dashboard", icon: Layout, exact: LayoutFilled, type: "a", exactClass: 'bg-primary/10' },
    { href: "/add", label: "Add", icon: Add, exact: AddFilled, type: "a", exactClass: 'bg-primary/10' },
    { href: "/sfc", label: "Notification", icon: Bell, exact: BellFilled, type: "a", exactClass: 'bg-primary/10' },
];
const isLoading = inject<Readonly<Ref<string, string>>>(isRouteLoading)!
</script>
<template>
    <Transition enter-active-class="transition-all duration-300 ease-in-out" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-all duration-200 ease-in-out"
        leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isLoading">
            <div class=":uno: fixed top-0 left-0 w-full bg-primary/40 z-50">
                <div class=":uno: w-full h-1 bg-primary/90 animate-loadingBar" />
            </div>
            <div class="fixed inset-0 z-40 backdrop-blur-[2px]" />
        </div>
    </Transition>
    <div class="fixed left-0 w-18 flex flex-col items-center pt-4 gap-6 z-41">
        <template v-for="i in links" :key="i.label">
            <Link v-if="i.type === 'a'" :exact-active-class="i.exactClass" :href="i.href" :class="className">
                <component :is="i.icon" />
                <template #exact>
                    <component :is="i.exact" />
                </template>
            </Link>
            <div v-else :class="className">
                <component :is="i.icon" />
            </div>
        </template>
        <div class="w-12 h-12 rounded-2xl hover:bg-primary/10 flex">
            <button class="h-[38px] w-[38px] rounded-full m-a ring-2 ring flex press-animated">
                <img class="h-8 w-8 rounded-full m-a ring-1 ring-white"
                    src="https://picsum.photos/seed/user123/40/40.jpg" alt="User avatar" />
            </button>
        </div>
    </div>
    <main class="flex flex-1 overflow-hidden md:ps-18">
        <div class="flex-1 overflow-auto p-4 bg-white rounded-lg md:(mr-2 mb-2) min-h-[calc(100vh-8rem)]">
            <slot />
        </div>
    </main>
</template>
