<script setup lang="ts">
import {computed, useAttrs} from 'vue'

defineOptions({inheritAttrs: false})
const attrs = useAttrs()
const svgClass = computed(() => ['animate-spin text-current', attrs.class ?? 'size-6'])
const restAttrs = computed(() => {
  const result = {...attrs}
  delete result.class
  return result
})
</script>
<template>
  <svg
    :class="svgClass"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    v-bind="restAttrs"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    />
    <circle
      class="opacity-90"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-dasharray="15.7 47.1"
    />
  </svg>
</template>
