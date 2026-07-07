<script setup lang="ts">
import AppNavMenu from '@/components/layout/AppNavMenu.vue'
import UiContainer from '@/components/ui/UiContainer.vue'
import UiLogo from '@/components/ui/UiLogo.vue'
import {useAuthStore} from '@/stores/auth'
import {RouterView} from 'vue-router'
import {useI18n} from 'vue-i18n'

const authStore = useAuthStore()
const {t} = useI18n()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-neutral-50">
    <header class="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur">
      <UiContainer class="flex min-h-14 flex-wrap items-center justify-between gap-3 py-2">
        <div class="flex min-w-0 items-center gap-3">
          <UiLogo size="sm" />
          <div class="min-w-0">
            <p class="truncate font-semibold text-ink">
              {{ authStore.displayName }}
            </p>
            <p class="text-xs text-muted">{{ t('app.tagline') }}</p>
          </div>
        </div>
        <AppNavMenu />
      </UiContainer>
    </header>
    <main class="flex-1 py-6">
      <RouterView />
    </main>
  </div>
</template>
