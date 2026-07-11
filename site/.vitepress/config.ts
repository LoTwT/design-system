import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vitepress"

export default defineConfig({
  title: "Ayingott Design System",
  description: "Showcase for @ayingott/theme tokens and visual language.",
  lang: "zh-CN",
  cleanUrls: true,
  appearance: true,
  srcExclude: ["DEPLOYMENT.md"],
  vite: {
    plugins: [tailwindcss()],
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Tokens", link: "/tokens/colors" },
      { text: "Utilities", link: "/utilities/focus-ring" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Package Contract", link: "/guide/package-contract" },
        ],
      },
      {
        text: "Tokens",
        items: [
          { text: "Colors", link: "/tokens/colors" },
          { text: "Typography", link: "/tokens/typography" },
          { text: "Spacing", link: "/tokens/spacing" },
          { text: "Effects", link: "/tokens/effects" },
          { text: "Semantic", link: "/tokens/semantic" },
        ],
      },
      {
        text: "Utilities",
        items: [
          { text: "Focus Ring", link: "/utilities/focus-ring" },
          { text: "Touch Target", link: "/utilities/touch-target" },
        ],
      },
      {
        text: "Assets",
        items: [{ text: "Fonts", link: "/fonts" }],
      },
    ],
    search: {
      provider: "local",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/LoTwT/design-system" },
    ],
    footer: {
      message: "@ayingott/theme V0 showcase. Source docs stay in /docs.",
      copyright: "Released under MIT.",
    },
  },
})
