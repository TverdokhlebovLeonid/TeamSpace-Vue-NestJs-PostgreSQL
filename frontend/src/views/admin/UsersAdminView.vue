<script setup lang="ts">
import * as usersApi from '@/api/users'
import {USER_ROLE} from '@/api/enum'
import IconPlus from '@/components/icon/Plus.vue'
import IconPencil from '@/components/icon/Pencil.vue'
import IconTrash from '@/components/icon/Trash.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiButtonIcon from '@/components/ui/UiButtonIcon.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiContainer from '@/components/ui/UiContainer.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UserEditDialog from '@/views/admin/UserEditDialog.vue'
import {useAuthStore} from '@/stores/auth'
import {useNotificationStore} from '@/stores/notification'
import type {CreateUserPayload, User, UserRole} from '@/types/auth'
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const {t} = useI18n()

const users = ref<User[]>([])
const loading = ref(false)
const creating = ref(false)
const showForm = ref(false)
const showEditDialog = ref(false)
const editingUser = ref<User | null>(null)

const form = ref<{username: string; email: string; password: string; role: UserRole}>({
  username: '',
  email: '',
  password: '',
  role: USER_ROLE.user
})
const usernameError = ref('')
const passwordError = ref('')

const roleOptions = computed(() => [
  {value: USER_ROLE.user, label: t('users.roleUser')},
  {value: USER_ROLE.admin, label: t('users.roleAdmin')}
])

async function loadUsers() {
  loading.value = true
  try {
    users.value = await usersApi.list()
  } catch {
    notificationStore.add({text: t('users.loadError'), type: 'error'})
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {username: '', email: '', password: '', role: USER_ROLE.user}
  usernameError.value = ''
  passwordError.value = ''
}

function validate() {
  usernameError.value = form.value.username.trim() ? '' : t('users.usernameRequired')
  passwordError.value = form.value.password.length >= 8 ? '' : t('users.passwordRequired')
  return !usernameError.value && !passwordError.value
}

async function handleCreate() {
  if (!validate()) return
  creating.value = true
  try {
    const payload: CreateUserPayload = {
      username: form.value.username.trim(),
      password: form.value.password,
      role: form.value.role
    }
    if (form.value.email.trim()) payload.email = form.value.email.trim()
    await usersApi.create(payload)
    notificationStore.add({text: t('users.createSuccess'), type: 'success'})
    resetForm()
    showForm.value = false
    await loadUsers()
  } finally {
    creating.value = false
  }
}

async function handleDelete(user: User) {
  if (!window.confirm(t('users.deleteConfirm', {username: user.username}))) return
  try {
    await usersApi.remove(user.id)
    notificationStore.add({text: t('users.deleteSuccess'), type: 'success'})
    await loadUsers()
  } catch {}
}

function openEdit(user: User) {
  editingUser.value = user
  showEditDialog.value = true
}

function handleUserSaved(updated: User) {
  users.value = users.value.map((item) => (item.id === updated.id ? updated : item))
}

onMounted(loadUsers)
</script>
<template>
  <UiContainer class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-ink">{{ t('users.title') }}</h1>
        <p class="mt-1 text-sm text-muted">{{ t('users.subtitle') }}</p>
      </div>
      <UiButton
        :label="t('users.add')"
        size="sm"
        @click="showForm = !showForm"
      />
    </div>

    <UiCard v-if="showForm">
      <div class="mb-4 flex items-center gap-2">
        <IconPlus class="size-5 text-ink" />
        <h2 class="text-lg font-semibold text-ink">{{ t('users.addTitle') }}</h2>
      </div>
      <form
        class="grid gap-4 sm:grid-cols-2"
        @submit.prevent="handleCreate"
      >
        <UiInput
          v-model="form.username"
          :label="t('users.username')"
          :placeholder="t('users.usernamePlaceholder')"
          autocomplete="off"
          required
          :error="usernameError"
        />
        <UiInput
          v-model="form.email"
          :label="t('users.email')"
          :placeholder="t('users.emailPlaceholder')"
          type="email"
          autocomplete="off"
        />
        <UiInput
          v-model="form.password"
          :label="t('users.password')"
          :placeholder="t('users.passwordPlaceholder')"
          type="password"
          autocomplete="new-password"
          required
          :error="passwordError"
        />
        <UiSelect
          v-model="form.role"
          :label="t('users.role')"
          :options="roleOptions"
        />
        <div class="flex items-center gap-2 sm:col-span-2">
          <UiButton
            :label="t('users.create')"
            type="submit"
            size="sm"
            :loading="creating"
          />
          <UiButton
            :label="t('users.cancel')"
            type="button"
            variant="secondary"
            size="sm"
            @click="
              () => {
                resetForm()
                showForm = false
              }
            "
          />
        </div>
      </form>
    </UiCard>

    <UiCard :padding="false">
      <div class="border-b border-neutral-200 p-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('users.list') }}
        </h2>
      </div>
      <p
        v-if="loading"
        class="p-6 text-sm text-muted"
      >
        {{ t('users.loading') }}
      </p>
      <p
        v-else-if="!users.length"
        class="p-6 text-sm text-muted"
      >
        {{ t('users.empty') }}
      </p>
      <ul
        v-else
        class="divide-y divide-neutral-100"
      >
        <li
          v-for="user in users"
          :key="user.id"
          class="flex items-center justify-between gap-3 p-4"
        >
          <div class="min-w-0">
            <p class="flex items-center gap-2 font-medium text-ink">
              <span class="truncate">{{ user.username }}</span>
              <span
                v-if="authStore.user && user.id === authStore.user.id"
                class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-muted"
              >
                {{ t('users.you') }}
              </span>
            </p>
            <p class="truncate text-xs text-muted">{{ user.email || '—' }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                user.role === USER_ROLE.admin
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-ink'
              "
            >
              {{ user.role === USER_ROLE.admin ? t('users.roleAdmin') : t('users.roleUser') }}
            </span>
            <UiButtonIcon
              :label="t('users.edit')"
              variant="neutral"
              size="sm"
              @click="openEdit(user)"
            >
              <IconPencil class="size-4" />
            </UiButtonIcon>
            <template v-if="authStore.user && user.id !== authStore.user.id">
              <UiButtonIcon
                :label="t('users.delete')"
                variant="danger"
                size="sm"
                @click="handleDelete(user)"
              >
                <IconTrash class="size-4" />
              </UiButtonIcon>
            </template>
          </div>
        </li>
      </ul>
    </UiCard>

    <UserEditDialog
      v-model:open="showEditDialog"
      :user="editingUser"
      @saved="handleUserSaved"
    />
  </UiContainer>
</template>
