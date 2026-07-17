<script setup lang="ts">
import circleCheckUrl from "lucide-static/icons/circle-check.svg?url"
import circleXUrl from "lucide-static/icons/circle-x.svg?url"
import infoUrl from "lucide-static/icons/info.svg?url"
import triangleAlertUrl from "lucide-static/icons/triangle-alert.svg?url"
import { computed } from "vue"

type ThemeIconName = "circle-check" | "circle-x" | "info" | "triangle-alert"

const props = defineProps<{
  name: ThemeIconName
}>()

const iconUrls: Record<ThemeIconName, string> = {
  "circle-check": circleCheckUrl,
  "circle-x": circleXUrl,
  "info": infoUrl,
  "triangle-alert": triangleAlertUrl,
}

const iconStyle = computed(() => ({
  "--theme-icon-url": `url("${iconUrls[props.name]}")`,
}))
</script>

<template>
  <span class="theme-icon" :style="iconStyle" aria-hidden="true" />
</template>
