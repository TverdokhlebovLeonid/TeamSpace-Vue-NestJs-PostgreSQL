<script setup lang="ts">
import IconChevronDown from '@/components/icon/ChevronDown.vue'
import {computed, onMounted, onUnmounted, ref, useId} from 'vue'

type Option = {
  value: string | number
  label: string
}

defineOptions({inheritAttrs: false})

const props = defineProps<{
  label?: string
  options: Option[]
  placeholder?: string
  error?: string
  required?: boolean
}>()

const model = defineModel<string | number>()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const labelId = useId()

const selectedLabel = computed(() => {
  const match = props.options.find((option) => option.value === model.value)
  if (match) return match.label
  return props.placeholder ?? ''
})

function select(value: string | number) {
  model.value = value
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div
    class="flex flex-col gap-1.5"
    v-bind="$attrs"
  >
    <label
      v-if="label"
      :id="labelId"
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
    <div
      ref="root"
      class="relative"
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-neutral-200"
        :class="
          error
            ? 'border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-100'
            : 'border-neutral-300 hover:border-neutral-400'
        "
        :aria-labelledby="label ? labelId : undefined"
        @click="open = !open"
      >
        <span :class="!selectedLabel && 'text-muted'">{{ selectedLabel || placeholder }}</span>
        <IconChevronDown
          class="ml-auto size-4 shrink-0 text-muted transition"
          :class="open && 'rotate-180'"
        />
      </button>
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <ul
          v-if="open"
          class="absolute z-30 mt-2 max-h-60 min-w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-card"
        >
          <li
            v-for="option in options"
            :key="option.value"
          >
            <button
              type="button"
              class="block w-full px-4 py-2 text-left text-sm transition hover:bg-neutral-100"
              :class="option.value === model ? 'font-semibold text-brand-600' : 'text-ink'"
              @click="select(option.value)"
            >
              {{ option.label }}
            </button>
          </li>
        </ul>
      </Transition>
    </div>
    <p
      v-if="error"
      class="text-xs text-red-600"
    >
      {{ error }}
    </p>
  </div>
</template>
