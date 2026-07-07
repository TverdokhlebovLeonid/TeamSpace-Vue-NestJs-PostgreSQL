import * as authApi from '@/api/auth'
import * as chatApi from '@/api/chat'
import {ClientEvent, ServerEvent, type TypingPayload} from '@/api/ws/protocol'
import {SocketClient, type SocketStatus} from '@/api/ws/socketClient'
import {forceLogoutRedirect} from '@/services/session'
import {useAuthStore} from '@/stores/auth'
import type {ChatMessage, Conversation} from '@/types/chat'
import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

const TYPING_TTL_MS = 3_000

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()

  const conversations = ref<Conversation[]>([])
  const activeId = ref<string | null>(null)
  const messagesByConversation = ref<Record<string, ChatMessage[]>>({})
  const typingByConversation = ref<Record<string, string[]>>({})
  const status = ref<SocketStatus>('idle')
  const loadingConversations = ref(false)
  const loadingMessages = ref(false)

  let client: SocketClient | null = null
  const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  const isConnected = computed(() => status.value === 'open')
  const activeConversation = computed(
    () => conversations.value.find((conversation) => conversation.id === activeId.value) ?? null
  )
  const activeMessages = computed(() =>
    activeId.value ? (messagesByConversation.value[activeId.value] ?? []) : []
  )

  function connect() {
    if (client) {
      client.connect()
      return
    }
    client = new SocketClient({
      getToken: () => authStore.accessToken,
      refreshToken: async () => {
        const tokens = await authApi.refreshToken()
        authStore.setAccessToken(tokens.access)
        return tokens.access
      },
      onSessionExpired: () => {
        disconnect()
        void forceLogoutRedirect()
      },
      onStatusChange: (next) => {
        status.value = next
      }
    })
    client.on(ServerEvent.NewMessage, (data) => handleIncomingMessage(data as ChatMessage))
    client.on(ServerEvent.Typing, (data) => handleTyping(data as TypingPayload))
    client.connect()
  }

  function disconnect() {
    client?.disconnect()
    client = null
    conversations.value = []
    activeId.value = null
    messagesByConversation.value = {}
    typingByConversation.value = {}
    typingTimers.forEach((timer) => clearTimeout(timer))
    typingTimers.clear()
  }

  async function loadConversations() {
    loadingConversations.value = true
    try {
      conversations.value = await chatApi.listConversations()
    } finally {
      loadingConversations.value = false
    }
  }

  async function openConversation(conversationId: string) {
    activeId.value = conversationId
    if (!messagesByConversation.value[conversationId]) await loadMessages(conversationId)
  }

  async function loadMessages(conversationId: string) {
    loadingMessages.value = true
    try {
      const messages = await chatApi.getMessages(conversationId)
      messagesByConversation.value = {
        ...messagesByConversation.value,
        [conversationId]: messages
      }
    } finally {
      loadingMessages.value = false
    }
  }

  function sendMessage(conversationId: string, content: string) {
    const trimmed = content.trim()
    if (!trimmed) return
    const sent = client?.send(ClientEvent.SendMessage, {conversationId, content: trimmed})
    if (!sent) void chatApi.sendMessage({conversationId, content: trimmed})
  }

  function notifyTyping(conversationId: string) {
    client?.send(ClientEvent.Typing, {conversationId})
  }

  async function startDirect(userId: string): Promise<Conversation> {
    const conversation = await chatApi.createDirect(userId)
    upsertConversation(conversation)
    await openConversation(conversation.id)
    return conversation
  }

  async function createGroup(title: string, memberIds: string[]): Promise<Conversation> {
    const conversation = await chatApi.createGroup({title, memberIds})
    upsertConversation(conversation)
    await openConversation(conversation.id)
    return conversation
  }

  function handleIncomingMessage(message: ChatMessage) {
    const existing = messagesByConversation.value[message.conversationId]
    if (existing) {
      if (!existing.some((item) => item.id === message.id)) {
        messagesByConversation.value = {
          ...messagesByConversation.value,
          [message.conversationId]: [...existing, message]
        }
      }
    }

    const conversation = conversations.value.find((item) => item.id === message.conversationId)
    if (conversation) {
      conversation.lastMessage = message
      conversation.updatedAt = message.createdAt
      conversations.value = [
        conversation,
        ...conversations.value.filter((item) => item.id !== conversation.id)
      ]
    } else {
      void loadConversations()
    }
    clearTyping(message.conversationId, message.senderId)
  }

  function handleTyping(payload: TypingPayload) {
    if (payload.userId === authStore.user?.id) return
    const current = typingByConversation.value[payload.conversationId] ?? []
    if (!current.includes(payload.userId)) {
      typingByConversation.value = {
        ...typingByConversation.value,
        [payload.conversationId]: [...current, payload.userId]
      }
    }
    const key = `${payload.conversationId}:${payload.userId}`
    const previous = typingTimers.get(key)
    if (previous) clearTimeout(previous)
    typingTimers.set(
      key,
      setTimeout(() => clearTyping(payload.conversationId, payload.userId), TYPING_TTL_MS)
    )
  }

  function clearTyping(conversationId: string, userId: string) {
    const current = typingByConversation.value[conversationId]
    if (current?.includes(userId)) {
      typingByConversation.value = {
        ...typingByConversation.value,
        [conversationId]: current.filter((id) => id !== userId)
      }
    }
    const key = `${conversationId}:${userId}`
    const timer = typingTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      typingTimers.delete(key)
    }
  }

  function typingUsers(conversationId: string): string[] {
    return typingByConversation.value[conversationId] ?? []
  }

  function upsertConversation(conversation: Conversation) {
    const others = conversations.value.filter((item) => item.id !== conversation.id)
    conversations.value = [conversation, ...others]
  }

  return {
    conversations,
    activeId,
    status,
    loadingConversations,
    loadingMessages,
    isConnected,
    activeConversation,
    activeMessages,
    connect,
    disconnect,
    loadConversations,
    openConversation,
    sendMessage,
    notifyTyping,
    startDirect,
    createGroup,
    typingUsers
  }
})
