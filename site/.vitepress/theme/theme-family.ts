export const DEFAULT_THEME_FAMILY = "default"
export const NEO_THEME_FAMILY = "neo"
export const THEME_FAMILY_ROOT_CLASS = "brutal"
export const THEME_FAMILY_STORAGE_KEY = "ayingott:theme-family"

export type ThemeFamily = typeof DEFAULT_THEME_FAMILY | typeof NEO_THEME_FAMILY

export const THEME_FAMILY_INIT_SCRIPT = `(() => {
  const root = document.documentElement
  let family = "${DEFAULT_THEME_FAMILY}"

  try {
    if (localStorage.getItem("${THEME_FAMILY_STORAGE_KEY}") === "${NEO_THEME_FAMILY}")
      family = "${NEO_THEME_FAMILY}"
  }
  catch {}

  root.classList.toggle("${THEME_FAMILY_ROOT_CLASS}", family === "${NEO_THEME_FAMILY}")
  root.dataset.themeFamily = family
})()`
