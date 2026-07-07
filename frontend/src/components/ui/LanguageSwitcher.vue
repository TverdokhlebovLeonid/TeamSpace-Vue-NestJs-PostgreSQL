<script setup lang="ts">
import {type AppLanguage, SUPPORTED_LANGUAGES} from '@/i18n'
import {useAuthStore} from '@/stores/auth'
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'

const authStore = useAuthStore()
const {t} = useI18n()
const current = computed(() => authStore.language)
const options = computed(() =>
  SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: t(`language.${code}`)
  }))
)
async function select(language: AppLanguage) {
  if (language === current.value) return
  await authStore.setLanguage(language)
}
</script>
<template>
  <div
    class="inline-flex items-center rounded-lg border border-neutral-200 bg-white p-0.5"
    role="group"
  >
    <button
      v-for="option in options"
      :key="option.code"
      type="button"
      class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
      :class="
        current === option.code
          ? 'bg-brand-600 text-white'
          : 'text-muted hover:bg-neutral-100 hover:text-ink'
      "
      @click="select(option.code)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
