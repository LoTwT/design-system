<script setup lang="ts">
import { computed } from "vue"
import { useThemeFamily } from "../composables/useThemeFamily"
import { NEO_THEME_FAMILY } from "../theme-family"

defineProps<{
  placement: "header" | "screen"
}>()

const {
  effectiveState,
  family,
  isReady,
  toggleThemeFamily,
} = useThemeFamily()

const isNeo = computed(() => family.value === NEO_THEME_FAMILY)
const switchTitle = computed(() => `Switch to ${isNeo.value ? "Default" : "Neo"} theme family`)
</script>

<template>
  <div
    class="theme-family-control"
    :class="[`theme-family-control--${placement}`, { 'is-ready': isReady }]"
    :aria-hidden="isReady ? undefined : 'true'"
  >
    <span class="theme-family-control__label">Theme family</span>
    <span
      class="theme-family-control__status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ isReady ? effectiveState : "Default · Light" }}
    </span>
    <button
      class="theme-family-switch"
      type="button"
      role="switch"
      aria-label="Neo theme family"
      :aria-checked="isNeo"
      :title="switchTitle"
      @click="toggleThemeFamily"
    >
      <span class="theme-family-switch__track" aria-hidden="true">
        <span class="theme-family-switch__thumb" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.theme-family-control {
  color: var(--vp-c-text-2);
  visibility: hidden;
}

.theme-family-control.is-ready {
  visibility: visible;
}

.theme-family-control--header {
  display: none;
  align-items: center;
  gap: var(--spacing-1);
  margin-inline-start: var(--spacing-2);
}

.theme-family-control--screen {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 var(--spacing-3);
  margin-block-start: var(--spacing-3);
  padding: var(--spacing-3) 0.875rem var(--spacing-3) var(--spacing-4);
  border: var(--border-width-control, var(--border-width-thin)) solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--vp-c-bg-soft);
}

.theme-family-control__label {
  grid-column: 1;
  grid-row: 1;
  color: var(--vp-c-text-2);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-base--line-height);
}

.theme-family-control__status {
  grid-column: 1;
  grid-row: 2;
  color: var(--vp-c-text-3);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  line-height: var(--text-xs--line-height);
  white-space: nowrap;
}

.theme-family-control--header .theme-family-control__label {
  display: none;
}

.theme-family-control--header .theme-family-control__status {
  display: none;
  min-inline-size: 6.75rem;
  color: var(--vp-c-text-2);
  font-size: var(--text-2xs);
  text-align: end;
}

.theme-family-switch {
  position: relative;
  grid-column: 2;
  grid-row: 1 / span 2;
  display: grid;
  flex: 0 0 var(--touch-target-min);
  place-items: center;
  width: var(--touch-target-min);
  min-width: var(--touch-target-min);
  height: var(--touch-target-min);
  min-height: var(--touch-target-min);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.theme-family-switch__track {
  position: relative;
  display: block;
  width: 2.5rem;
  height: 1.5rem;
  border: var(--border-width-control, var(--border-width-thin)) solid var(--border-default);
  border-radius: var(--radius-control);
  background: var(--surface-muted);
}

.theme-family-switch__thumb {
  position: absolute;
  inset-block-start: 0.1875rem;
  inset-inline-start: 0.1875rem;
  width: 1rem;
  height: 1rem;
  border-radius: var(--radius-control);
  background: var(--text-primary);
  transform: translateX(0);
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.theme-family-switch[aria-checked="true"] .theme-family-switch__track {
  background: var(--accent-primary);
}

.theme-family-switch[aria-checked="true"] .theme-family-switch__thumb {
  background: var(--accent-contrast);
  transform: translateX(1rem);
}

.theme-family-switch:hover .theme-family-switch__track {
  border-color: var(--vp-c-brand-1);
}

.theme-family-switch:active .theme-family-switch__track {
  border-color: var(--accent-primary-active);
}

.theme-family-switch:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
  box-shadow: var(--focus-ring-shadow);
}

@media (min-width: 768px) {
  .theme-family-control--header {
    display: flex;
  }

  .theme-family-control--screen {
    display: none;
  }
}

@media (min-width: 1280px) {
  .theme-family-control--header .theme-family-control__status {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-family-switch__thumb {
    transition-duration: 0s;
  }
}
</style>
