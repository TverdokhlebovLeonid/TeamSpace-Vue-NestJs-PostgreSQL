<script setup lang="ts">
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiContainer from '@/components/ui/UiContainer.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiLogo from '@/components/ui/UiLogo.vue'
import {useAuthStore} from '@/stores/auth'
import {useNotificationStore} from '@/stores/notification'
import {isAxiosError} from 'axios'
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const route = useRoute()
const router = useRouter()
const {t} = useI18n()
const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')
const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' ? redirect : '/'
})
function validate() {
  usernameError.value = username.value.trim() ? '' : t('login.usernameRequired')
  passwordError.value = password.value ? '' : t('login.passwordRequired')
  return !usernameError.value && !passwordError.value
}
async function handleSubmit() {
  if (!validate()) return
  try {
    await authStore.login({
      username: username.value.trim(),
      password: password.value
    })
    notificationStore.add({
      text: t('login.success'),
      type: 'success'
    })
    await router.replace(redirectPath.value)
  } catch (error) {
    if (isAxiosError(error)) {
      const data = error.response?.data as {message?: string; detail?: string} | undefined
      passwordError.value = data?.message || data?.detail || t('login.invalidCredentials')
    }
  }
}
</script>
<template>
  <div class="min-h-screen bg-linear-to-br from-neutral-100 via-white to-neutral-200">
    <UiContainer class="flex min-h-screen items-center justify-center py-10">
      <UiCard class="w-full max-w-md">
        <div class="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div class="mb-8 space-y-3 text-center">
          <UiLogo
            size="md"
            centered
          />
          <h1 class="text-2xl font-bold text-ink">{{ t('login.welcome') }}</h1>
          <p class="text-sm text-muted">{{ t('login.subtitle') }}</p>
        </div>
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <UiInput
            v-model="username"
            :label="t('login.username')"
            :placeholder="t('login.usernamePlaceholder')"
            autocomplete="username"
            required
            :error="usernameError"
          />
          <UiInput
            v-model="password"
            :label="t('login.password')"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
            :error="passwordError"
          />
          <UiButton
            :label="t('login.submit')"
            type="submit"
            block
            :loading="authStore.loading"
          />
        </form>
      </UiCard>
    </UiContainer>
  </div>
</template>
