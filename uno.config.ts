// unocss.config.ts
import {
  defineConfig,
  presetWind4,
  presetIcons,
  transformerVariantGroup,
  transformerCompileClass,
} from "unocss";
import presetAnimations from "unocss-preset-animations";
import { presetBootstrapBtn } from "./plugins/bootstrap_btn";

export default defineConfig({
  presets: [
    presetWind4() as any,
    presetAnimations(),
    presetIcons({
      extraProperties: { display: "block" },
    }),
    presetBootstrapBtn(),
  ],
  // By default, `.ts` and `.js` files are NOT extracted.
  // If you want to extract them, use the following configuration.
  // It's necessary to add the following configuration if you use shadcn-vue or shadcn-svelte.
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        "(components|src)/**/*.{js,ts,vue,jsx,tsx}",
        "./src/**/*.{js,jsx,ts,tsx,vue,md,mdx,html,svelte,astro}",
        "./src/**/*.server.{js,jsx,ts,tsx,vue,md,mdx,html,svelte,astro}",
        "../server/**/*.{ts,tsx,js,jsx,html}",
      ],
    },
  },
  theme: {
    colors: {
      primary: {
        DEFAULT: "#14a74b",
        light: "#76da83",
        active: "#119c45",
        "active-light": "#aff6b8",
        dark: "#025c15",
      },
      success: {
        DEFAULT: "#2dc76b",
        light: "#17c653",
      },
      info: {
        DEFAULT: "#39a6ea",
        light: "#39c1ea",
      },
      danger: {
        DEFAULT: "#f8285a",
        light: "#f8285a",
        active: "#d1214c",
      },
      warning: {
        DEFAULT: "#f0f9ff",
        light: "#f0f9ff",
      },
      secondary: {
        DEFAULT: "#fd7906",
        light: "#fbb06f",
        inverse: "#4b5675",
        dark: "#b34700",
      },
      dark: {
        DEFAULT: "#161f2d",
        light: "#4d4d4d",
      },
      white: {
        DEFAULT: "#ffffff",
        light: "#f8f9fa",
      },
      light: {
        DEFAULT: "#f8f9fa",
        light: "#e2e6ea",
        dark: "#e2e6ea",
      },
    },
    boxShadow: {
      "primary-box": "2px 2px 10px #aff6b8",
      "card-box": "0px 3px 4px 0px #00000008",
    },
    radius: {
      none: "0px",
      sm: "0.125rem", // 2px
      DEFAULT: "0.25rem", // 4px (áp dụng cho .rounded)
      md: "0.375rem", // 6px
      lg: "0.5rem", // 8px
      xl: "0.75rem", // 12px
      "2xl": "1rem", // 16px
      "3xl": "1.5rem", // 24px
      full: "9999px",
    },
  },
  shortcuts: [
    ["press-animated",
      "transition-all duration-200 ease-[cubic-bezier(.22,1,.36,1)] active:translate-y-0 active:scale-90 active:shadow-md"],
    ["animate-loadingBar", ["animation", "loadingBar 1.5s linear infinite"]],
  ],
  transformers: [transformerVariantGroup(), transformerCompileClass()],
  preflights: [
    {
      getCSS: (context) => {
        return `
      :root {
        --font-sans: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
        --font-serif: 'Playfair Display', serif, 'Times New Roman', Times, serif;
      }
      :focus {
        outline-color: ${context.theme.colors?.primary?.active};
        outline-width: 1px
      }
		@keyframes loadingBar {
          0% { transform: translateX(-100%); }
		  50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
          .glass-nav {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .text-gradient {
            background: linear-gradient(135deg, #064e3b 0%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
      `;
      },
    },
  ],
});
