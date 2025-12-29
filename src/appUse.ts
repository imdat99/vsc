import { PrimeVue } from "@primevue/core";
import Tooltip from "primevue/tooltip";
import Aura from '@primeuix/themes/aura';
export function appUse(app: ReturnType<typeof import("vue").createSSRApp>) {
    app.use(PrimeVue, {
        theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.my-app-dark'
        }
    }
    });
    app.directive('tooltip', Tooltip);
}