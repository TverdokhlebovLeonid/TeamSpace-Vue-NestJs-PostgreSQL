<script setup lang="ts">
withDefaults(
  defineProps<{
    hover?: boolean
    padding?: boolean
  }>(),
  {
    hover: false,
    padding: true
  }
)
</script>
<template>
  <div
    class="rounded-2xl border border-neutral-200/70 bg-white shadow-soft transition"
    :class="[hover && 'hover:-translate-y-1 hover:shadow-card', padding && 'p-6']"
  >
    <slot />
  </div>
</template>
