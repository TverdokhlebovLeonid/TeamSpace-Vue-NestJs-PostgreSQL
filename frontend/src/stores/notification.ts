import type {NotificationItem, NotificationMessage} from '@/types/notification'
import {defineStore} from 'pinia'
import {ref} from 'vue'

const DEFAULT_DURATION = 5000
const MAX_ITEMS = 8
let nextId = 0
export const useNotificationStore = defineStore('notification', () => {
  const items = ref<NotificationItem[]>([])
  function add(payload: NotificationMessage) {
    const item: NotificationItem = {
      ...payload,
      id: ++nextId,
      duration: payload.duration ?? DEFAULT_DURATION
    }
    items.value.push(item)
    if (items.value.length > MAX_ITEMS) items.value.shift()
    return item.id
  }
  function remove(id: number) {
    items.value = items.value.filter((item) => item.id !== id)
  }
  return {items, add, remove}
})
