<script setup lang="ts">
import IconPlus from '@/components/icon/Plus.vue'
import UiButtonIcon from '@/components/ui/UiButtonIcon.vue'
import UiContainer from '@/components/ui/UiContainer.vue'
import NewChatDialog from '@/views/chat/NewChatDialog.vue'
import {useAuthStore} from '@/stores/auth'
import {useChatStore} from '@/stores/chat'
import {useNotificationStore} from '@/stores/notification'
import type {Conversation} from '@/types/chat'
import {computed, nextTick, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'

const chatStore = useChatStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const {t} = useI18n()

const draft = ref('')
const showDialog = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
let typingThrottle = 0

const statusLabel = computed(() => {
  switch (chatStore.status) {
    case 'open':
      return t('chat.statusOnline')
    case 'connecting':
    case 'reconnecting':
      return t('chat.statusConnecting')
    default:
      return t('chat.statusOffline')
  }
})

function conversationName(conversation: Conversation): string {
  if (conversation.title) return conversation.title
  return t('chat.untitled')
}

function conversationInitial(conversation: Conversation): string {
  return conversationName(conversation).charAt(0).toUpperCase() || '#'
}

function senderName(conversationId: string, senderId: string): string {
  const conversation = chatStore.conversations.find((item) => item.id === conversationId)
  const participant = conversation?.participants.find((person) => person.id === senderId)
  if (!participant) return ''
  const fullName = `${participant.firstName} ${participant.lastName}`.trim()
  return fullName || participant.username
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
}

const typingLabel = computed(() => {
  if (!chatStore.activeId) return ''
  const ids = chatStore.typingUsers(chatStore.activeId)
  if (!ids.length) return ''
  const names = ids.map((id) => senderName(chatStore.activeId as string, id)).filter(Boolean)
  if (!names.length) return t('chat.typing')
  return t('chat.typingNamed', {name: names.join(', ')})
})

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

async function selectConversation(id: string) {
  try {
    await chatStore.openConversation(id)
    await scrollToBottom()
  } catch {
    notificationStore.add({text: t('chat.loadError'), type: 'error'})
  }
}

function handleSend() {
  if (!chatStore.activeId || !draft.value.trim()) return
  chatStore.sendMessage(chatStore.activeId, draft.value)
  draft.value = ''
}

function handleTyping() {
  if (!chatStore.activeId) return
  const now = Date.now()
  if (now - typingThrottle > 1500) {
    typingThrottle = now
    chatStore.notifyTyping(chatStore.activeId)
  }
}

watch(
  () => chatStore.activeMessages.length,
  () => void scrollToBottom()
)

onMounted(async () => {
  chatStore.connect()
  try {
    await chatStore.loadConversations()
  } catch {
    notificationStore.add({text: t('chat.loadError'), type: 'error'})
  }
})
</script>

<template>
  <UiContainer>
    <div
      class="grid h-[calc(100vh-7.5rem)] grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-soft md:grid-cols-[320px_1fr]"
    >
      <aside
        class="flex min-h-0 flex-col border-neutral-200 md:border-r"
        :class="chatStore.activeId ? 'hidden md:flex' : 'flex'"
      >
        <div class="flex items-center justify-between gap-2 border-b border-neutral-200 p-4">
          <div class="min-w-0">
            <h1 class="text-lg font-bold text-ink">{{ t('chat.title') }}</h1>
            <p class="flex items-center gap-1.5 text-xs text-muted">
              <span
                class="size-2 rounded-full"
                :class="chatStore.isConnected ? 'bg-success' : 'bg-warning'"
              />
              {{ statusLabel }}
            </p>
          </div>
          <UiButtonIcon
            :label="t('chat.newChat')"
            size="sm"
            @click="showDialog = true"
          >
            <IconPlus class="size-4" />
          </UiButtonIcon>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <p
            v-if="chatStore.loadingConversations"
            class="p-4 text-sm text-muted"
          >
            {{ t('chat.loading') }}
          </p>
          <p
            v-else-if="!chatStore.conversations.length"
            class="p-4 text-sm text-muted"
          >
            {{ t('chat.emptyConversations') }}
          </p>
          <ul v-else>
            <li
              v-for="conversation in chatStore.conversations"
              :key="conversation.id"
            >
              <button
                type="button"
                class="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition hover:bg-neutral-50"
                :class="conversation.id === chatStore.activeId && 'bg-neutral-100'"
                @click="selectConversation(conversation.id)"
              >
                <span
                  class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
                >
                  {{ conversationInitial(conversation) }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-center justify-between gap-2">
                    <span class="truncate font-medium text-ink">
                      {{ conversationName(conversation) }}
                    </span>
                    <span
                      v-if="conversation.lastMessage"
                      class="shrink-0 text-[11px] text-muted"
                    >
                      {{ formatTime(conversation.lastMessage.createdAt) }}
                    </span>
                  </span>
                  <span class="block truncate text-xs text-muted">
                    {{ conversation.lastMessage?.content || t('chat.noMessages') }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <section
        class="flex min-h-0 flex-col"
        :class="chatStore.activeId ? 'flex' : 'hidden md:flex'"
      >
        <template v-if="chatStore.activeConversation">
          <header class="flex items-center gap-3 border-b border-neutral-200 p-4">
            <UiButtonIcon
              :label="t('chat.back')"
              size="sm"
              variant="neutral"
              class="md:hidden"
              @click="chatStore.activeId = null"
            >
              <span class="text-lg leading-none">‹</span>
            </UiButtonIcon>
            <span
              class="flex size-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
            >
              {{ conversationInitial(chatStore.activeConversation) }}
            </span>
            <div class="min-w-0">
              <p class="truncate font-semibold text-ink">
                {{ conversationName(chatStore.activeConversation) }}
              </p>
              <p class="truncate text-xs text-muted">
                {{
                  chatStore.activeConversation.participants
                    .map((person) => person.username)
                    .join(', ')
                }}
              </p>
            </div>
          </header>

          <div
            ref="messagesEl"
            class="min-h-0 flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-4"
          >
            <p
              v-if="chatStore.loadingMessages"
              class="text-center text-sm text-muted"
            >
              {{ t('chat.loading') }}
            </p>
            <template
              v-for="message in chatStore.activeMessages"
              :key="message.id"
            >
              <div
                class="flex"
                :class="message.senderId === authStore.user?.id ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-soft"
                  :class="
                    message.senderId === authStore.user?.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-ink'
                  "
                >
                  <p
                    v-if="
                      chatStore.activeConversation.type === 'group' &&
                      message.senderId !== authStore.user?.id
                    "
                    class="mb-0.5 text-[11px] font-semibold text-brand-500"
                  >
                    {{ senderName(message.conversationId, message.senderId) }}
                  </p>
                  <p class="whitespace-pre-wrap wrap-break-word">{{ message.content }}</p>
                  <p
                    class="mt-1 text-right text-[10px]"
                    :class="
                      message.senderId === authStore.user?.id ? 'text-white/70' : 'text-muted'
                    "
                  >
                    {{ formatTime(message.createdAt) }}
                  </p>
                </div>
              </div>
            </template>
            <p
              v-if="typingLabel"
              class="text-xs italic text-muted"
            >
              {{ typingLabel }}
            </p>
          </div>

          <form
            class="flex items-center gap-2 border-t border-neutral-200 p-3"
            @submit.prevent="handleSend"
          >
            <input
              v-model="draft"
              type="text"
              :placeholder="t('chat.messagePlaceholder')"
              class="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-neutral-200"
              @input="handleTyping"
            />
            <button
              type="submit"
              :disabled="!draft.trim()"
              class="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {{ t('chat.send') }}
            </button>
          </form>
        </template>

        <div
          v-else
          class="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted"
        >
          {{ t('chat.selectConversation') }}
        </div>
      </section>
    </div>

    <NewChatDialog v-model:open="showDialog" />
  </UiContainer>
</template>
