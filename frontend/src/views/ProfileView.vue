<script setup lang="ts">
import * as usersApi from '@/api/users'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiContainer from '@/components/ui/UiContainer.vue'
import UiInput from '@/components/ui/UiInput.vue'
import {useAuthStore} from '@/stores/auth'
import {useNotificationStore} from '@/stores/notification'
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const {t} = useI18n()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const currentError = ref('')
const newError = ref('')
const confirmError = ref('')
const saving = ref(false)

function validate() {
  currentError.value = currentPassword.value ? '' : t('profile.currentRequired')
  newError.value = newPassword.value.length >= 8 ? '' : t('profile.newTooShort')
  confirmError.value =
    newPassword.value === confirmPassword.value ? '' : t('profile.confirmMismatch')
  return !currentError.value && !newError.value && !confirmError.value
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    await usersApi.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    notificationStore.add({text: t('profile.success'), type: 'success'})
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch {
    currentError.value = t('profile.saveError')
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <UiContainer class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-ink">{{ t('profile.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ t('profile.subtitle') }}</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <UiCard>
        <h2 class="text-lg font-semibold text-ink">{{ t('profile.accountTitle') }}</h2>
        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">{{ t('profile.usernameLabel') }}</dt>
            <dd class="font-medium text-ink">{{ authStore.user?.username }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">{{ t('profile.emailLabel') }}</dt>
            <dd class="font-medium text-ink">{{ authStore.user?.email || '—' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">{{ t('profile.roleLabel') }}</dt>
            <dd class="font-medium text-ink">{{ authStore.role }}</dd>
          </div>
        </dl>
        <div class="mt-6 border-t border-neutral-200 pt-4">
          <p class="mb-2 text-sm font-medium text-ink">{{ t('profile.languageTitle') }}</p>
          <LanguageSwitcher />
        </div>
      </UiCard>

      <UiCard>
        <h2 class="text-lg font-semibold text-ink">{{ t('profile.passwordTitle') }}</h2>
        <form
          class="mt-4 space-y-4"
          @submit.prevent="handleSubmit"
        >
          <UiInput
            v-model="currentPassword"
            :label="t('profile.currentPassword')"
            type="password"
            autocomplete="current-password"
            :error="currentError"
          />
          <UiInput
            v-model="newPassword"
            :label="t('profile.newPassword')"
            type="password"
            autocomplete="new-password"
            :error="newError"
          />
          <UiInput
            v-model="confirmPassword"
            :label="t('profile.confirmPassword')"
            type="password"
            autocomplete="new-password"
            :error="confirmError"
          />
          <UiButton
            :label="t('profile.save')"
            type="submit"
            :loading="saving"
          />
        </form>
      </UiCard>
    </div>
  </UiContainer>
</template>
