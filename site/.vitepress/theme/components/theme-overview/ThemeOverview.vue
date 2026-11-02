<script setup lang="ts">
import ThemeFamilyMatrix from "./ThemeFamilyMatrix.vue"
import ThemeInteractionStates from "./ThemeInteractionStates.vue"
import ThemeReadingSpecimen from "./ThemeReadingSpecimen.vue"
</script>

<template>
  <div class="theme-showcase">
    <section class="theme-section theme-section--about" aria-labelledby="about-semantic-tokens">
      <div class="theme-section__heading">
        <h2 id="about-semantic-tokens">About Semantic Tokens</h2>
      </div>
      <div class="theme-prose">
        <p>Semantic tokens are named values that describe intent, not appearance. They map to CSS custom properties that can be consumed directly in any project, without JavaScript or a framework adapter.</p>
        <p>Paper and Ink give long-form reading, documentation, and code a calm, high-contrast surface. Neo Light and Dark keep the same roles and spacing, and swap in hard borders, flat stickers, and press feedback.</p>
      </div>
    </section>

    <ThemeFamilyMatrix />
    <ThemeReadingSpecimen class="theme-section--reading" />
    <ThemeInteractionStates />

    <section class="theme-section theme-section--source" data-index="§ 5.0" aria-labelledby="token-source">
      <div class="theme-section__heading">
        <h2 id="token-source">Token Source</h2>
      </div>
      <div class="theme-token-source" translate="no">
        <code>@import "tailwindcss";</code>
        <code>@import "@ayingott/theme";</code>
        <code>@import "@ayingott/theme/brutal.css";</code>
        <span><code>.dark</code> controls scheme · <code>.brutal</code> opts into the family</span>
      </div>
    </section>

    <section class="theme-field-states" aria-label="Field states">
      <div class="theme-form-row">
        <label class="theme-field">
          <span>Input</span>
          <input class="theme-input" type="text" value="Paper &amp; Ink">
        </label>
        <label class="theme-choice">
          <input type="radio" name="theme-example" checked>
          <span>Selected semantic mode</span>
        </label>
        <button class="theme-action theme-action--primary theme-focus-on-accent" type="button">Accent focus</button>
      </div>
    </section>
  </div>
</template>
