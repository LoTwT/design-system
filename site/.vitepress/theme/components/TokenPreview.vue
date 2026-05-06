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

        <div class="min-h-16 rounded-md bg-[var(--surface-subtle)] p-3">
          <div
            v-if="preview === 'spacing'"
            class="h-6 rounded-sm bg-[var(--accent-primary)]"
            :style="{ width: `var(--${token.name})` }"
          />
          <div
            v-else-if="preview === 'radius'"
            class="h-12 bg-[var(--accent-soft)]"
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
            class="h-12 rounded-card bg-[var(--accent-soft)] transition-transform hover:translate-x-4"
            :style="{ transitionDuration: token.value }"
          />
          <div v-else class="token-value">{{ token.value }}</div>
        </div>
      </article>
    </div>
  </section>
</template>
