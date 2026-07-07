<script setup lang="ts">
import {computed} from 'vue'

type Size = 'sm' | 'md'
const props = withDefaults(
  defineProps<{
    label?: string
    size?: Size
    centered?: boolean
  }>(),
  {
    label: 'TeamSpace',
    size: 'md',
    centered: false
  }
)
const sizeClasses: Record<Size, string> = {
  sm: 'rounded-xl px-3 py-1.5 text-sm',
  md: 'rounded-2xl px-5 py-2.5 text-lg shadow-soft'
}
const classes = computed(() => [
  'inline-flex w-fit items-center gap-2 bg-brand-600 font-bold text-white',
  sizeClasses[props.size],
  props.centered && 'mx-auto'
])
</script>
<template>
  <div :class="classes">
    <svg
      viewBox="0 0 32 32"
      class="size-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="12"
        r="3.2"
      />
      <circle
        cx="21"
        cy="12"
        r="3.2"
        opacity="0.55"
      />
      <path d="M5 24c0-3.6 2.9-6.2 6-6.2s6 2.6 6 6.2z" />
      <path
        d="M15 24c0-3.6 2.9-6.2 6-6.2s6 2.6 6 6.2z"
        opacity="0.55"
      />
    </svg>
    {{ label }}
  </div>
</template>
