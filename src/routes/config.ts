import { createMemoryHistory, createRouter, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("../components/Layout/Root"),
    children: [
      {
        path: "",
        name: "Dashboard",
        // redirect: { name: "overview" },
        component: () => import("@/components/Layout/Root"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/components/NotfoundPage.server.vue"),
  },
];

const router = createRouter({
  history: createMemoryHistory(), // server
  routes,
});
export default router;
