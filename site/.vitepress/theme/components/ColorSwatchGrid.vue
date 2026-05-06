<script setup lang="ts">
import { computed } from "vue"
import colorsCss from "../../../../packages/theme/src/foundation/colors.css?raw"
import darkCss from "../../../../packages/theme/src/semantic/dark.css?raw"
import lightCss from "../../../../packages/theme/src/semantic/light.css?raw"
import { byPrefix, parseTokens } from "./token-utils"

const props = withDefaults(
  defineProps<{
    title?: string
    prefix: string
    source?: "colors" | "semantic-light" | "semantic-dark"
  }>(),
  {
    source: "colors",
  },
)

const cssBySource = {
  colors: colorsCss,
  "semantic-light": lightCss,
  "semantic-dark": darkCss,
}

const tokens = computed(() => byPrefix(parseTokens(cssBySource[props.source]), props.prefix))
</script>

<template>
  <section class="token-section">
    <h3 v-if="title">{{ title }}</h3>
    <div class="token-grid">
      <article v-for="token in tokens" :key="token.name" class="token-card overflow-hidden">
        <div
          class="h-20 border-b"
          :style="{ background: `var(--${token.name})`, borderColor: 'var(--border-subtle)' }"
        />
        <div class="token-card__body">
          <div class="token-label">--{{ token.name }}</div>
          <div class="token-value">{{ token.value }}</div>
        </div>
      </article>
    </div>
  </section>
</template>
