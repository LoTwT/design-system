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
    <span v-if="placement === 'screen'" class="theme-family-control__label">Theme family</span>
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
        <span class="theme-family-switch__thumb">
          <svg
            class="theme-family-switch__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          </svg>
        </span>
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
  margin-inline-start: 0;
}

.theme-family-control--screen {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 var(--spacing-3);
  margin-block-start: var(--spacing-3);
  padding: var(--spacing-3) 0.875rem var(--spacing-3) var(--spacing-4);
  border: var(--border-width-control) solid var(--border-subtle);
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

/* The header keeps the live region for screen readers only; the visible
   text lives in the screen (mobile) placement. */
.theme-family-control--header .theme-family-control__status {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  margin: -1px;
  clip: rect(0 0 0 0);
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

/* Mirror the appearance toggle's geometry: a 40x22 track centered in the
   44px target, an 18px thumb sliding 18px, and a 12px icon in the thumb. */
.theme-family-switch__track {
  position: relative;
  display: block;
  width: 2.5rem;
  height: 1.375rem;
  border: 1px solid var(--vp-input-border-color);
  border-radius: 11px;
  background-color: var(--vp-input-switch-bg-color);
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}

.theme-family-switch__thumb {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--vp-c-neutral-inverse);
  box-shadow: var(--vp-shadow-1);
  transform: translateX(0);
  transition: transform var(--duration-fast) var(--ease-standard);
}

.theme-family-switch__icon {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  color: var(--vp-c-text-2);
}

.dark .theme-family-switch__icon {
  color: var(--vp-c-text-1);
}

.theme-family-switch:hover .theme-family-switch__track {
  border-color: var(--vp-c-brand-1);
}

.theme-family-switch[aria-checked="true"] .theme-family-switch__track {
  border-color: var(--accent-primary);
  background-color: var(--accent-primary);
}

.theme-family-switch[aria-checked="true"] .theme-family-switch__thumb {
  transform: translateX(18px);
}

.theme-family-switch[aria-checked="true"]:hover .theme-family-switch__track {
  border-color: var(--accent-primary-hover);
  background-color: var(--accent-primary-hover);
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

@media (prefers-reduced-motion: reduce) {
  .theme-family-switch__track,
  .theme-family-switch__thumb {
    transition-duration: 0s;
  }
}
</style>
