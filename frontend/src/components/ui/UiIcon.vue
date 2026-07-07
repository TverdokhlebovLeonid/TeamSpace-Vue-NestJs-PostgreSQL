<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string
    viewBox?: string
    strokeWidth?: number | string
  }>(),
  {
    size: 24,
    viewBox: '0 0 24 24',
    strokeWidth: 2
  }
)
</script>
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <slot />
  </svg>
</template>
