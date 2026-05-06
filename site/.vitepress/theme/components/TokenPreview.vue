<script setup lang="ts">
import { computed } from "vue"
import borderCss from "../../../../packages/theme/src/foundation/border.css?raw"
import motionCss from "../../../../packages/theme/src/foundation/motion.css?raw"
import radiusCss from "../../../../packages/theme/src/foundation/radius.css?raw"
import shadowCss from "../../../../packages/theme/src/foundation/shadow.css?raw"
import sizingCss from "../../../../packages/theme/src/foundation/sizing.css?raw"
import spacingCss from "../../../../packages/theme/src/foundation/spacing.css?raw"
import transitionsCss from "../../../../packages/theme/src/layers/transitions.css?raw"
import { byPrefix, parseTokens } from "./token-utils"

const props = withDefaults(
  defineProps<{
    source: "spacing" | "sizing" | "radius" | "shadow" | "border" | "motion" | "transitions"
    prefix: string
    preview?: "spacing" | "radius" | "shadow" | "border" | "motion" | "plain"
  }>(),
  {
    preview: "plain",
  },
)

const cssBySource = {
  border: borderCss,
  motion: motionCss,
  radius: radiusCss,
  shadow: shadowCss,
  sizing: sizingCss,
  spacing: spacingCss,
  transitions: transitionsCss,
}

const tokens = computed(() => byPrefix(parseTokens(cssBySource[props.source]), props.prefix))
</script>

<template>
  <section class="token-section">
    <div class="grid gap-3">
      <article
        v-for="token in tokens"
        :key="token.name"
        class="token-card grid items-center gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_10rem]"
      >
        <div>
          <div class="token-label">--{{ token.name }}</div>
          <div class="token-value">{{ token.value }}</div>
        </div>

        <div
          class="min-h-16 rounded-md p-3"
          :style="{ backgroundColor: preview === 'shadow' ? 'var(--surface-canvas)' : 'var(--surface-subtle)' }"
        >
          <div
            v-if="preview === 'spacing'"
            class="h-6 rounded-sm bg-[var(--accent-primary)]"
            :style="{ width: `var(--${token.name})` }"
          />
          <div
            v-else-if="preview === 'radius'"
            class="h-12 bg-[var(--accent-primary)]"
            :style="{ borderRadius: `var(--${token.name})` }"
          />
          <div
            v-else-if="preview === 'shadow'"
            class="h-12 rounded-card bg-[var(--surface-elevated)]"
            :style="{ boxShadow: `var(--${token.name})` }"
          />
          <div
            v-else-if="preview === 'border'"
            class="h-12 rounded-card bg-[var(--surface-elevated)]"
            :style="{ borderWidth: token.value, borderStyle: 'solid', borderColor: 'var(--accent-primary)' }"
          />
          <div
            v-else-if="preview === 'motion'"
            class="motion-demo"
          >
            <span
              class="motion-demo__bar"
              :style="{ transitionDuration: `var(--${token.name})` }"
            />
          </div>
          <div
            v-else-if="source === 'transitions'"
            class="transition-demo"
            :style="{ transition: `var(--${token.name})` }"
          >
            <span class="transition-demo__dot" />
          </div>
          <div v-else class="token-value">{{ token.value }}</div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.motion-demo {
  display: flex;
  align-items: center;
  height: 3rem;
  padding-inline: var(--spacing-3);
  border-radius: var(--radius-card);
  background: var(--accent-soft);
}

.motion-demo__bar {
  display: block;
  width: 34%;
  height: var(--spacing-4);
  border-radius: var(--radius-full);
  background: var(--accent-primary);
  transform: translateX(0);
  transition-property: width, transform, opacity;
  transition-timing-function: var(--ease-standard);
  transition-duration: inherit;
}

.motion-demo:hover .motion-demo__bar {
  width: 62%;
  opacity: var(--opacity-emphasis);
  transform: translateX(1.5rem);
}

.transition-demo {
  display: flex;
  align-items: center;
  height: 3rem;
  padding-inline: var(--spacing-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--accent-soft);
  box-shadow: var(--shadow-xs);
}

.transition-demo__dot {
  width: var(--spacing-3);
  height: var(--spacing-3);
  border-radius: var(--radius-full);
  background: var(--accent-primary);
  opacity: var(--opacity-subtle);
  transform: translateX(0) scale(1);
  transition: inherit;
}

.transition-demo:hover {
  border-color: var(--accent-primary-hover);
  background: var(--accent-primary);
  box-shadow: var(--shadow-md);
}

.transition-demo:hover .transition-demo__dot {
  background: var(--text-inverse);
  opacity: 1;
  transform: translateX(2rem) scale(1.2);
}

@media (prefers-reduced-motion: reduce) {
  .motion-demo__bar {
    transition-duration: 0ms !important;
  }
}
</style>
