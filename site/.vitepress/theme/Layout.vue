<script setup lang="ts">
import DefaultTheme from "vitepress/theme-without-fonts"
import ThemeFamilyControl from "./components/ThemeFamilyControl.vue"

const { Layout: DefaultThemeLayout } = DefaultTheme
</script>

<template>
  <DefaultThemeLayout>
    <template #nav-bar-content-after>
      <ThemeFamilyControl placement="header" />
    </template>
    <template #nav-screen-content-after>
      <ThemeFamilyControl placement="screen" />
    </template>
  </DefaultThemeLayout>
</template>
