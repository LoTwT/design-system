import { computed, onMounted, shallowRef } from "vue"
import { useData } from "vitepress"
import {
  DEFAULT_THEME_FAMILY,
  NEO_THEME_FAMILY,
  THEME_FAMILY_ROOT_CLASS,
  THEME_FAMILY_STORAGE_KEY,
  type ThemeFamily,
} from "../theme-family"

const selectedFamily = shallowRef<ThemeFamily>(DEFAULT_THEME_FAMILY)
let hasInitialized = false

function applyThemeFamily(family: ThemeFamily, persist: boolean) {
  const root = document.documentElement

  selectedFamily.value = family
  root.classList.toggle(THEME_FAMILY_ROOT_CLASS, family === NEO_THEME_FAMILY)
  root.dataset.themeFamily = family

  if (!persist)
    return

  try {
    localStorage.setItem(THEME_FAMILY_STORAGE_KEY, family)
  }
  catch {}
}

function initializeThemeFamily() {
  if (hasInitialized)
    return

  const restoredFamily = document.documentElement.classList.contains(THEME_FAMILY_ROOT_CLASS)
    ? NEO_THEME_FAMILY
    : DEFAULT_THEME_FAMILY

  applyThemeFamily(restoredFamily, false)
  hasInitialized = true
}

export function useThemeFamily() {
  const { isDark } = useData()
  const isReady = shallowRef(false)
  const family = computed(() => selectedFamily.value)
  const effectiveState = computed(
    () => `${family.value === NEO_THEME_FAMILY ? "Neo" : "Default"} · ${isDark.value ? "Dark" : "Light"}`,
  )

  onMounted(() => {
    initializeThemeFamily()
    isReady.value = true
  })

  function toggleThemeFamily() {
    applyThemeFamily(
      selectedFamily.value === NEO_THEME_FAMILY
        ? DEFAULT_THEME_FAMILY
        : NEO_THEME_FAMILY,
      true,
    )
  }

  return {
    effectiveState,
    family,
    isReady,
    toggleThemeFamily,
  }
}
