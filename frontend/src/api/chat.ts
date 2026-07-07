import Http from '@/api/http'
import type {ChatMessage, Conversation} from '@/types/chat'

const API_CHAT_PREFIX = '/api/chat'

export const listConversations = async () => {
  const {data} = await Http.get<Conversation[]>(`${API_CHAT_PREFIX}/conversations`)
  return data
}

export const createGroup = async (payload: {title: string; memberIds: string[]}) => {
  const {data} = await Http.post<Conversation>(`${API_CHAT_PREFIX}/conversations/group`, payload)
  return data
}

export const createDirect = async (userId: string) => {
  const {data} = await Http.post<Conversation>(`${API_CHAT_PREFIX}/conversations/direct`, {
    userId
  })
  return data
}

export const getMessages = async (
  conversationId: string,
  params?: {limit?: number; before?: string}
) => {
  const {data} = await Http.get<ChatMessage[]>(
    `${API_CHAT_PREFIX}/conversations/${conversationId}/messages`,
    {params}
  )
  return data
}

export const sendMessage = async (payload: {conversationId: string; content: string}) => {
  const {data} = await Http.post<ChatMessage>(`${API_CHAT_PREFIX}/messages`, payload)
  return data
}
