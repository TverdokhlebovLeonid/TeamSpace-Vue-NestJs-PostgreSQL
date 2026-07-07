<script setup lang="ts">
import UiSpinner from '@/components/ui/UiSpinner.vue'
import {computed} from 'vue'
import {RouterLink} from 'vue-router'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'
const props = withDefaults(
  defineProps<{
    label: string
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    to?: string
    block?: boolean
    loading?: boolean
    disabled?: boolean
    active?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    block: false,
    loading: false,
    disabled: false,
    active: false
  }
)
const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-soft',
  secondary:
    'bg-white text-ink ring-1 ring-inset ring-neutral-300 hover:bg-neutral-100 focus-visible:outline-brand-600',
  ghost: 'bg-transparent text-ink hover:bg-neutral-100 focus-visible:outline-neutral-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 shadow-soft'
}
const activeGhostClasses = 'bg-neutral-100 text-ink ring-1 ring-inset ring-neutral-300'
const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5'
}
const classes = computed(() => [
  'inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
  props.active && props.variant === 'ghost' ? activeGhostClasses : variantClasses[props.variant],
  sizeClasses[props.size],
  props.block && 'w-full'
])
</script>
<template>
  <RouterLink
    v-if="to"
    :to="to"
    :class="classes"
  >
    {{ label }}
  </RouterLink>
  <button
    v-else
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
  >
    <UiSpinner
      v-if="loading"
      class="size-4"
    />
    {{ label }}
  </button>
</template>
