<script setup lang="ts">
import ThemeIcon from "./ThemeIcon.vue"
</script>

<template>
  <div class="theme-status-grid">
    <article class="theme-status theme-status--success">
      <ThemeIcon name="circle-check" />
      <div class="theme-status__copy">
        <strong>Success</strong>
        <p>Action completed.</p>
      </div>
    </article>
    <article class="theme-status theme-status--warning">
      <ThemeIcon name="triangle-alert" />
      <div class="theme-status__copy">
        <strong>Warning</strong>
        <p>Check this soon.</p>
      </div>
    </article>
    <article class="theme-status theme-status--danger">
      <ThemeIcon name="circle-x" />
      <div class="theme-status__copy">
        <strong>Danger</strong>
        <p>Action required.</p>
      </div>
    </article>
    <article class="theme-status theme-status--info">
      <ThemeIcon name="info" />
      <div class="theme-status__copy">
        <strong>Info</strong>
        <p>For your information.</p>
      </div>
    </article>
  </div>
</template>
