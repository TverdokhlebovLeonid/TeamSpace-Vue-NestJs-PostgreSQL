<script setup lang="ts">
import * as usersApi from '@/api/users'
import IconClose from '@/components/icon/Close.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiButtonIcon from '@/components/ui/UiButtonIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import {useChatStore} from '@/stores/chat'
import {useNotificationStore} from '@/stores/notification'
import type {Contact} from '@/types/chat'
import {computed, onUnmounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'

const open = defineModel<boolean>('open', {required: true})

const chatStore = useChatStore()
const notificationStore = useNotificationStore()
const {t} = useI18n()

const mode = ref<'direct' | 'group'>('direct')
const contacts = ref<Contact[]>([])
const loading = ref(false)
const search = ref('')
const groupTitle = ref('')
const selectedIds = ref<string[]>([])
const submitting = ref(false)

const filteredContacts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return contacts.value
  return contacts.value.filter((contact) =>
    `${contact.username} ${contact.firstName} ${contact.lastName}`.toLowerCase().includes(term)
  )
})

function contactName(contact: Contact): string {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim()
  return fullName || contact.username
}

function close() {
  open.value = false
}

function reset() {
  mode.value = 'direct'
  search.value = ''
  groupTitle.value = ''
  selectedIds.value = []
}

function toggleMember(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id]
}

async function loadContacts() {
  loading.value = true
  try {
    contacts.value = await usersApi.contacts()
  } catch {
    notificationStore.add({text: t('chat.contactsError'), type: 'error'})
  } finally {
    loading.value = false
  }
}

async function startDirect(contact: Contact) {
  submitting.value = true
  try {
    await chatStore.startDirect(contact.id)
    close()
  } catch {
    notificationStore.add({text: t('chat.createError'), type: 'error'})
  } finally {
    submitting.value = false
  }
}

async function createGroup() {
  if (!groupTitle.value.trim() || !selectedIds.value.length) return
  submitting.value = true
  try {
    await chatStore.createGroup(groupTitle.value.trim(), selectedIds.value)
    close()
  } catch {
    notificationStore.add({text: t('chat.createError'), type: 'error'})
  } finally {
    submitting.value = false
  }
}

watch(open, (isOpen) => {
  document.body.classList.toggle('modal-open', isOpen)
  if (isOpen) {
    reset()
    void loadContacts()
  }
})

onUnmounted(() => {
  document.body.classList.remove('modal-open')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        @click.self="close"
      >
        <div
          class="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-card sm:max-w-md sm:rounded-2xl"
        >
          <div class="flex items-center justify-between border-b border-neutral-200 p-4">
            <h2 class="text-lg font-bold text-ink">{{ t('chat.newChat') }}</h2>
            <UiButtonIcon
              :label="t('common.close')"
              size="sm"
              variant="neutral"
              @click="close"
            >
              <IconClose class="size-4" />
            </UiButtonIcon>
          </div>

          <div class="flex gap-1 border-b border-neutral-200 p-2">
            <button
              type="button"
              class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition"
              :class="
                mode === 'direct' ? 'bg-brand-600 text-white' : 'text-ink hover:bg-neutral-100'
              "
              @click="mode = 'direct'"
            >
              {{ t('chat.directTab') }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition"
              :class="
                mode === 'group' ? 'bg-brand-600 text-white' : 'text-ink hover:bg-neutral-100'
              "
              @click="mode = 'group'"
            >
              {{ t('chat.groupTab') }}
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-4">
            <UiInput
              v-if="mode === 'group'"
              v-model="groupTitle"
              :label="t('chat.groupName')"
              :placeholder="t('chat.groupNamePlaceholder')"
              class="mb-3"
            />
            <UiInput
              v-model="search"
              :placeholder="t('chat.searchContacts')"
              class="mb-3"
            />

            <p
              v-if="loading"
              class="text-sm text-muted"
            >
              {{ t('chat.loading') }}
            </p>
            <p
              v-else-if="!filteredContacts.length"
              class="text-sm text-muted"
            >
              {{ t('chat.noContacts') }}
            </p>
            <ul
              v-else
              class="space-y-1"
            >
              <li
                v-for="contact in filteredContacts"
                :key="contact.id"
              >
                <button
                  v-if="mode === 'direct'"
                  type="button"
                  :disabled="submitting"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-neutral-100 disabled:opacity-50"
                  @click="startDirect(contact)"
                >
                  <span
                    class="flex size-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
                  >
                    {{ contactName(contact).charAt(0).toUpperCase() }}
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate font-medium text-ink">
                      {{ contactName(contact) }}
                    </span>
                    <span class="block truncate text-xs text-muted">@{{ contact.username }}</span>
                  </span>
                </button>
                <label
                  v-else
                  class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-neutral-100"
                >
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(contact.id)"
                    class="size-4 accent-brand-600"
                    @change="toggleMember(contact.id)"
                  />
                  <span class="min-w-0">
                    <span class="block truncate font-medium text-ink">
                      {{ contactName(contact) }}
                    </span>
                    <span class="block truncate text-xs text-muted">@{{ contact.username }}</span>
                  </span>
                </label>
              </li>
            </ul>
          </div>

          <div
            v-if="mode === 'group'"
            class="border-t border-neutral-200 p-4"
          >
            <UiButton
              :label="t('chat.createGroup')"
              block
              :loading="submitting"
              :disabled="!groupTitle.trim() || !selectedIds.length"
              @click="createGroup"
            />
          </div>
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
