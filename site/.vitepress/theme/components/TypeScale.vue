<script setup lang="ts">
import { computed } from "vue"
import typographyCss from "../../../../packages/theme/src/foundation/typography.css?raw"
import { parseTokens } from "./token-utils"

const textTokens = computed(() => {
  const tokens = parseTokens(typographyCss)
  const lineHeights = new Map(
    tokens
      .filter((token) => token.name.endsWith("--line-height"))
      .map((token) => [token.name.replace("--line-height", ""), token.value]),
  )

  return tokens
    .filter((token) => token.name.startsWith("text-") && !token.name.endsWith("--line-height"))
    .map((token) => ({
      ...token,
      lineHeight: lineHeights.get(token.name) ?? "normal",
    }))
})
</script>

<template>
  <section class="token-section">
    <div class="grid gap-3">
      <article
        v-for="token in textTokens"
        :key="token.name"
        class="token-card p-4"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div class="token-label">--{{ token.name }}</div>
          <div class="token-value">{{ token.value }} / {{ token.lineHeight }}</div>
        </div>
        <p
          class="m-0 font-display"
          :style="{ fontSize: `var(--${token.name})`, lineHeight: token.lineHeight }"
        >
          Ayingott 设计系统展示
        </p>
      </article>
    </div>
  </section>
</template>
