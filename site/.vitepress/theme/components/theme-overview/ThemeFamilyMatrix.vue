<script setup lang="ts">
import ThemeIcon from "./ThemeIcon.vue"
</script>

<template>
  <section class="theme-section theme-family" data-index="§ 1.5" aria-labelledby="theme-family-matrix">
    <div class="theme-section__heading">
      <h2 id="theme-family-matrix">Theme matrix</h2>
    </div>

    <dl class="theme-mode-matrix" aria-label="Effective theme selectors">
      <div class="theme-mode-matrix__row">
        <dt class="theme-mode-matrix__heading">Default family</dt>
        <dd class="theme-mode-matrix__option">
          <span class="theme-mode-matrix__scheme">Light</span>
          <span class="theme-mode-matrix__value"><strong>Paper</strong><code>:root</code></span>
        </dd>
        <dd class="theme-mode-matrix__option">
          <span class="theme-mode-matrix__scheme">Dark</span>
          <span class="theme-mode-matrix__value"><strong>Ink</strong><code>.dark</code></span>
        </dd>
      </div>
      <div class="theme-mode-matrix__row">
        <dt class="theme-mode-matrix__heading">Neo-Brutal family</dt>
        <dd class="theme-mode-matrix__option">
          <span class="theme-mode-matrix__scheme">Light</span>
          <span class="theme-mode-matrix__value"><strong>Neo Light</strong><code>.brutal</code></span>
        </dd>
        <dd class="theme-mode-matrix__option">
          <span class="theme-mode-matrix__scheme">Dark</span>
          <span class="theme-mode-matrix__value"><strong>Neo Dark</strong><code>.brutal.dark</code></span>
        </dd>
      </div>
    </dl>

    <div class="theme-brutal-grid">
      <article class="theme-brutal-specimen brutal" data-visual-mode="brutal-light">
        <header class="theme-brutal-specimen__heading">
          <span>Neo Light</span>
          <code>.brutal</code>
        </header>
        <div class="theme-brutal-specimen__panel">
          <p class="theme-brutal-specimen__eyebrow">Surface + control roles</p>
          <h3>Hard edges. Shared anatomy.</h3>
          <p class="theme-brutal-reading">Reading roles remain semantic, while the family changes border, radius, depth, color, and press feedback.</p>
          <div class="theme-brutal-specimen__actions">
            <button class="theme-action theme-action--primary pressable focus-ring touch-target" type="button">Pressable</button>
            <button class="theme-action pressable focus-ring touch-target" type="button" disabled>Disabled</button>
          </div>
          <div class="theme-status theme-status--info">
            <ThemeIcon name="info" />
            <div class="theme-status__copy">
              <strong>Info sticker</strong>
              <p>Pure white stays bound to blue.</p>
            </div>
          </div>
        </div>
      </article>

      <article class="theme-brutal-specimen brutal dark" data-visual-mode="brutal-dark">
        <header class="theme-brutal-specimen__heading">
          <span>Neo Dark</span>
          <code>.brutal.dark</code>
        </header>
        <div class="theme-brutal-specimen__panel">
          <p class="theme-brutal-specimen__eyebrow">Same roles, dark scheme</p>
          <h3>Paper ink flips. Stickers do not.</h3>
          <p class="theme-brutal-reading">The scheme axis changes canvas, reading, border, and focus roles without changing the component structure.</p>
          <div class="theme-brutal-specimen__actions">
            <button class="theme-action theme-action--primary pressable focus-ring touch-target" type="button">Pressable</button>
            <button class="theme-action pressable focus-ring touch-target" type="button" disabled>Disabled</button>
          </div>
          <div class="theme-status theme-status--success">
            <ThemeIcon name="circle-check" />
            <div class="theme-status__copy">
              <strong>Success sticker</strong>
              <p>Fixed ink remains legible.</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
