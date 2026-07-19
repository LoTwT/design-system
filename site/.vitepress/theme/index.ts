import type { Theme } from "vitepress"
import DefaultTheme from "vitepress/theme-without-fonts"
import ColorSwatchGrid from "./components/ColorSwatchGrid.vue"
import TokenPreview from "./components/TokenPreview.vue"
import ThemeOverview from "./components/theme-overview/ThemeOverview.vue"
import TypeScale from "./components/TypeScale.vue"
import Layout from "./Layout.vue"
import "./style.css"

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("ColorSwatchGrid", ColorSwatchGrid)
    app.component("TokenPreview", TokenPreview)
    app.component("ThemeOverview", ThemeOverview)
    app.component("TypeScale", TypeScale)
  },
} satisfies Theme
