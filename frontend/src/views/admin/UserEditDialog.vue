<script setup lang="ts">
import * as usersApi from '@/api/users'
import {USER_ROLE} from '@/api/enum'
import IconClose from '@/components/icon/Close.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiButtonIcon from '@/components/ui/UiButtonIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import {SUPPORTED_LANGUAGES} from '@/i18n'
import {useAuthStore} from '@/stores/auth'
import {useNotificationStore} from '@/stores/notification'
import type {User} from '@/types/auth'
import type {EditUserForm, FormField} from '@/views/admin/types'
import {computed, onUnmounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  saved: [user: User]
}>()

const open = defineModel<boolean>('open', {required: true})

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const {t} = useI18n()

const saving = ref(false)
const usernameError = ref('')

const form = ref<EditUserForm>({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  role: USER_ROLE.user,
  language: 'en'
})

const roleOptions = computed(() => [
  {value: USER_ROLE.user, label: t('users.roleUser')},
  {value: USER_ROLE.admin, label: t('users.roleAdmin')}
])

const languageOptions = computed(() =>
  SUPPORTED_LANGUAGES.map((code) => ({
    value: code,
    label: t(`language.${code}`)
  }))
)

const formFields = computed<FormField[]>(() => [
  {
    key: 'username',
    kind: 'input',
    labelKey: 'users.username',
    placeholderKey: 'users.usernamePlaceholder',
    required: true,
    error: usernameError.value
  },
  {
    key: 'email',
    kind: 'input',
    labelKey: 'users.email',
    placeholderKey: 'users.emailPlaceholder',
    type: 'email'
  },
  {
    key: 'role',
    kind: 'select',
    labelKey: 'users.role',
    options: roleOptions.value
  },
  {
    key: 'language',
    kind: 'select',
    labelKey: 'users.language',
    options: languageOptions.value
  },
  {
    key: 'firstName',
    kind: 'input',
    labelKey: 'users.firstName',
    placeholderKey: 'users.firstNamePlaceholder'
  },
  {
    key: 'lastName',
    kind: 'input',
    labelKey: 'users.lastName',
    placeholderKey: 'users.lastNamePlaceholder'
  }
])

const isSelf = computed(
  () => props.user !== null && authStore.user !== null && props.user.id === authStore.user.id
)

function close() {
  open.value = false
}

function resetForm() {
  if (!props.user) return
  form.value = {
    username: props.user.username,
    email: props.user.email,
    firstName: props.user.firstName,
    lastName: props.user.lastName,
    role: props.user.role,
    language: props.user.language
  }
  usernameError.value = ''
}

function validate() {
  usernameError.value = form.value.username.trim() ? '' : t('users.usernameRequired')
  return !usernameError.value
}

async function handleSubmit() {
  if (!props.user || !validate()) return
  saving.value = true
  try {
    const updated = await usersApi.update(props.user.id, {
      username: form.value.username.trim(),
      email: form.value.email.trim(),
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      role: form.value.role,
      language: form.value.language
    })
    notificationStore.add({text: t('users.updateSuccess'), type: 'success'})
    if (isSelf.value) {
      authStore.syncUser(updated)
    }
    emit('saved', updated)
    close()
  } catch {
    notificationStore.add({text: t('users.updateError'), type: 'error'})
  } finally {
    saving.value = false
  }
}

watch(open, (isOpen) => {
  document.body.classList.toggle('modal-open', isOpen)
  if (isOpen) resetForm()
})

onUnmounted(() => {
  document.body.classList.remove('modal-open')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open && user"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        @click.self="close"
      >
        <div
          class="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-card sm:max-w-lg sm:rounded-2xl"
        >
          <div class="flex items-center justify-between border-b border-neutral-200 p-4">
            <h2 class="text-lg font-bold text-ink">{{ t('users.editTitle') }}</h2>
            <UiButtonIcon
              :label="t('common.close')"
              size="sm"
              variant="neutral"
              @click="close"
            >
              <IconClose class="size-4" />
            </UiButtonIcon>
          </div>

          <form
            class="min-h-0 flex-1 overflow-y-auto p-4"
            @submit.prevent="handleSubmit"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <template
                v-for="field in formFields"
                :key="field.key"
              >
                <UiInput
                  v-if="field.kind === 'input'"
                  v-model="form[field.key]"
                  :label="t(field.labelKey)"
                  :placeholder="field.placeholderKey ? t(field.placeholderKey) : ''"
                  :type="field.type"
                  autocomplete="off"
                  :required="field.required"
                  :error="field.error"
                />
                <UiSelect
                  v-else
                  v-model="form[field.key]"
                  :label="t(field.labelKey)"
                  :options="field.options"
                />
              </template>
            </div>

            <div class="mt-6 flex items-center gap-2">
              <UiButton
                :label="t('users.save')"
                type="submit"
                size="sm"
                :loading="saving"
              />
              <UiButton
                :label="t('users.cancel')"
                type="button"
                variant="secondary"
                size="sm"
                @click="close"
              />
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
