<script setup lang="ts">
import ThemeStatusRoles from "./ThemeStatusRoles.vue"
</script>

<template>
  <section class="theme-section" data-index="§ 3.0" aria-labelledby="interaction-states">
    <div class="theme-section__heading">
      <h2 id="interaction-states">Interaction states</h2>
    </div>

    <div class="theme-state-grid">
      <article class="theme-state">
        <h3>Primary action</h3>
        <button class="theme-action theme-action--primary" type="button">Primary action</button>
      </article>

      <article class="theme-state">
        <h3>Disabled</h3>
        <button class="theme-action" type="button" disabled>Disabled</button>
      </article>

      <article class="theme-state">
        <h3>Inline link</h3>
        <a class="theme-inline-link" href="#token-source">Inline link</a>
      </article>

      <article class="theme-state">
        <h3>Focused element</h3>
        <button class="theme-action theme-focus-preview" type="button">Focused element</button>
      </article>

      <article class="theme-state theme-state--saved">
        <h3>Saved</h3>
        <p>All changes saved.</p>
      </article>
    </div>

    <div class="theme-status-block">
      <h3>Status roles</h3>
      <ThemeStatusRoles />
    </div>
  </section>
</template>
