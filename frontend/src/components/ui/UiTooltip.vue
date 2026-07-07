<script setup lang="ts">
import {computed} from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    placement?: 'top' | 'bottom'
  }>(),
  {
    placement: 'bottom'
  }
)
const tooltipClasses = computed(() =>
  props.placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
)
</script>
<template>
  <span class="group/tooltip relative inline-flex max-w-full">
    <slot />
    <span
      role="tooltip"
      class="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-soft transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      :class="tooltipClasses"
    >
      {{ text }}
    </span>
  </span>
</template>
