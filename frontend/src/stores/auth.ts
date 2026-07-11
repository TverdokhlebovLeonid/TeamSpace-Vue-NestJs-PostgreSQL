import {CSRF_COOKIE_NAME} from '@/api/constants'
import {USER_ROLE} from '@/api/enum'
import * as authApi from '@/api/auth'
import * as usersApi from '@/api/users'
import router from '@/router'
import {useChatStore} from '@/stores/chat'
import {
  applyLocale,
  i18n,
  readGuestLanguage,
  resolveUserLanguage,
  saveGuestLanguage,
  type AppLanguage
} from '@/i18n'
import {setHeadersToken} from '@/services/authToken'
import {useNotificationStore} from '@/stores/notification'
import type {LoginCredentials, User} from '@/types/auth'
import {getCookie} from '@/utils/cookies'
import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const accessToken = ref<string | null>(null)
  const language = ref<AppLanguage>(readGuestLanguage())
  const isAuthenticated = computed(() => Boolean(accessToken.value))
  const username = computed(() => user.value?.username ?? '')
  const role = computed(() => user.value?.role ?? null)
  const isAdmin = computed(() => user.value?.role === USER_ROLE.admin)
  const displayName = computed(() => {
    const current = user.value
    if (!current) return ''
    const fullName = [current.lastName, current.firstName].filter(Boolean).join(' ')
    return fullName || current.username
  })
  function setAccessToken(token: string | null) {
    accessToken.value = token
    setHeadersToken(token)
  }
  function applyLanguage(next: AppLanguage) {
    language.value = next
    applyLocale(next)
  }
  function clearSession() {
    setAccessToken(null)
    user.value = null
    applyLanguage(readGuestLanguage())
  }
  async function setLanguage(next: AppLanguage) {
    applyLanguage(next)
    if (!isAuthenticated.value) {
      saveGuestLanguage(next)
      return
    }
    try {
      user.value = await usersApi.updateMe({language: next})
      useNotificationStore().add({
        text: i18n.global.t('common.updateSuccess'),
        type: 'success'
      })
    } catch {
      applyLanguage(resolveUserLanguage(user.value?.language))
    }
  }
  async function loadProfile() {
    user.value = await usersApi.getMe()
    applyLanguage(resolveUserLanguage(user.value.language))
  }
  function syncUser(next: User) {
    user.value = next
    applyLanguage(resolveUserLanguage(next.language))
  }
  async function initialize() {
    if (initialized.value) return
    initialized.value = true
    if (!getCookie(CSRF_COOKIE_NAME)) {
      clearSession()
      return
    }
    try {
      const tokens = await authApi.refreshToken()
      setAccessToken(tokens.access)
      await loadProfile()
    } catch {
      clearSession()
    }
  }
  async function login(credentials: LoginCredentials) {
    loading.value = true
    try {
      const tokens = await authApi.login(credentials)
      setAccessToken(tokens.access)
      await loadProfile()
    } finally {
      loading.value = false
    }
  }
  async function logout() {
    useChatStore().disconnect()
    try {
      await authApi.logout()
    } catch {}
    clearSession()
    if (router.currentRoute.value.name !== 'login') await router.replace({name: 'login'})
  }
  return {
    user,
    initialized,
    loading,
    language,
    accessToken,
    isAuthenticated,
    username,
    role,
    isAdmin,
    displayName,
    initialize,
    login,
    logout,
    setLanguage,
    syncUser,
    setAccessToken,
    clearSession
  }
})
