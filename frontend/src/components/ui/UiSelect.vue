<script setup lang="ts">
import {useId} from 'vue'

defineOptions({inheritAttrs: false})
defineProps<{
  label?: string
  options: {value: string; label: string}[]
  required?: boolean
}>()
const model = defineModel<string>()
const id = useId()
</script>
<template>
  <div
    class="flex flex-col gap-1.5"
    v-bind="$attrs"
  >
    <label
      v-if="label"
      :for="id"
      class="text-sm font-medium text-ink"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-red-500"
      >
        *
      </span>
    </label>
    <select
      :id="id"
      v-model="model"
      class="w-full appearance-none rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-neutral-200"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
