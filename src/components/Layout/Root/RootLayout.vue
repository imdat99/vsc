<script lang="ts" setup>
import { defineComponent, ref } from "vue";
import Header from "./Header.server.vue";
import { Link } from "@/integrations/router/client";

// export default defineComponent(
//     (_p, { slots }) => {
//         const links = [
//             { href: "/", label: "Home", icon: "home" },
//             { href: "/dashboard", label: "Dashboard" },
//             { href: "/settings", label: "Settings" },
//             { href: "/sfc", label: "sfc" },
//         ];
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
    <!-- <Header /> -->
    <div class="fixed left-0 w-18 flex flex-col items-center pt-4 gap-6">
        <Link href="home" exactActiveClass="bg-red" class="w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated"><img class="h-8 w-8" src="/apple-touch-icon.png" alt="Logo" />
        </Link>
        <Link href="home" class="w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated">
            <svg aria-hidden="true" aria-label="" class="v-mid m-a" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M4.6 22.73A107 107 0 0 0 11 23h2.22c2.43-.04 4.6-.16 6.18-.27A3.9 3.9 0 0 0 23 18.8v-8.46a4 4 0 0 0-1.34-3L14.4.93a3.63 3.63 0 0 0-4.82 0L2.34 7.36A4 4 0 0 0 1 10.35v8.46a3.9 3.9 0 0 0 3.6 3.92M13.08 2.4l7.25 6.44a2 2 0 0 1 .67 1.5v8.46a1.9 1.9 0 0 1-1.74 1.92q-1.39.11-3.26.19V16a4 4 0 0 0-8 0v4.92q-1.87-.08-3.26-.19A1.9 1.9 0 0 1 3 18.81v-8.46a2 2 0 0 1 .67-1.5l7.25-6.44a1.63 1.63 0 0 1 2.16 0M13.12 21h-2.24a1 1 0 0 1-.88-1v-4a2 2 0 1 1 4 0v4a1 1 0 0 1-.88 1"></path></svg>
        </Link>
        <Link href="home" class="w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated">
            <svg aria-hidden="true" aria-label="" class="v-mid m-a" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M17.33 18.74a10 10 0 1 1 1.41-1.41l4.47 4.47-1.41 1.41zM11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16"></path></svg>
        </Link>
        <Link href="home" class="w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated">
            <svg aria-hidden="true" aria-label="" class="v-mid m-a" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M23 5a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4zm-10 6V3h6a2 2 0 0 1 2 2v6zm8 8a2 2 0 0 1-2 2h-6v-8h8zM5 3h6v18H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2"></path></svg>
        </Link>
        <Link href="home" class="w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated">
            <svg aria-hidden="true" aria-label="" class="v-mid m-a" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M11 11H6v2h5v5h2v-5h5v-2h-5V6h-2zM5 1a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4zm16 4v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2"></path></svg>
        </Link>
        <Link href="home" class="w-12 h-12 p-2 rounded-2xl hover:bg-primary/10 flex press-animated">
            <svg aria-hidden="true" aria-label="" class="v-mid m-a" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16 19h8v-2h-.34a3.15 3.15 0 0 1-3.12-2.76l-.8-6.41a7.8 7.8 0 0 0-15.48 0l-.8 6.41A3.15 3.15 0 0 1 .34 17H0v2h8v1h.02a3.4 3.4 0 0 0 3.38 3h1.2a3.4 3.4 0 0 0 3.38-3H16zm1.75-10.92.8 6.4c.12.95.5 1.81 1.04 2.52H4.4c.55-.7.92-1.57 1.04-2.51l.8-6.41a5.8 5.8 0 0 1 11.5 0M13.4 19c.33 0 .6.27.6.6 0 .77-.63 1.4-1.4 1.4h-1.2a1.4 1.4 0 0 1-1.4-1.4c0-.33.27-.6.6-.6z"></path></svg>
        </Link>
        <div class="w-12 h-12 rounded-2xl hover:bg-primary/10 flex">
        <button class="h-[38px] w-[38px] rounded-full m-a ring-2 ring flex press-animated">

        <img class="h-8 w-8 rounded-full m-a ring-1 ring-white" src="https://picsum.photos/seed/user123/40/40.jpg" alt="User avatar" />
        </button>
        </div>
    </div>
    <main class="flex flex-1 overflow-hidden md:ps-18">
        <div
            class="flex-1 overflow-auto p-4 bg-white rounded-lg md:(mr-2 mb-2) min-h-[calc(100vh-8rem)]"
        >
             <slot />
        </div>
    </main>
</template>
