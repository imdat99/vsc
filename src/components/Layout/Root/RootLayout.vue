<script lang="ts" setup>
import { defineComponent, Fragment, ref } from "vue";
import Header from "./Header.server.vue";
import { Link } from "@/integrations/router/client";
import { Home, HomeFilled, Add, AddFilled, Bell, BellFilled, Dashboard, DashboardFilled, Search } from "@/components/icons";

// export default defineComponent(
//     (_p, { slots }) => {
        const className = ":uno: w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated"
        const links = [
            { href: "/", label: "Home", icon: Home, exact: HomeFilled, type: "a" },
            { href: "/search", label: "Search", icon: Search, exact: Search, type: "btn" },
            { href: "/dashboard", label: "Dashboard", icon: Dashboard, exact: DashboardFilled, type: "a" },
            { href: "/add", label: "Add", icon: Add, exact: AddFilled, type: "a" },
            { href: "/sfc", label: "Notification", icon: Bell, exact: BellFilled, type: "a" },
        ];
//         const count = ref(1991);
//         return () => (
//             <>

//             </>
//         );
//     },
//     { name: "LayoutRoot" },
// );
</script>
<template>
    <div class="fixed left-0 w-18 flex flex-col items-center pt-4 gap-6">
        <Link href="/"
            class="w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated"><img class="h-8 w-8"
            src="/apple-touch-icon.png" alt="Logo" />
        </Link>
  
        <template  v-for="i in links" :key="i.label">
            <Link v-if="i.type === 'a'" :href="i.href"
                :class="className">
                <component :is="i.icon" />
                <template #exact>
                    <component :is="i.exact" />
                </template>
            </Link>
            <div v-else
                :class="className">
                <component :is="i.icon"/>
            </div>
        </template >
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
