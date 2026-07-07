import router from '@/router'
import {useAuthStore} from '@/stores/auth'
import {useChatStore} from '@/stores/chat'
export async function forceLogoutRedirect(): Promise<void> {
  const authStore = useAuthStore()
  useChatStore().disconnect()
  authStore.setAccessToken(null)
  if (router.currentRoute.value.name !== 'login') await router.replace({name: 'login'})
  authStore.clearSession()
}
