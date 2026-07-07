import * as authApi from '@/api/auth'
import {API_BASE_URL} from '@/api/constants'
import {i18n} from '@/i18n'
import {forceLogoutRedirect} from '@/services/session'
import {useAuthStore} from '@/stores/auth'
import {useNotificationStore} from '@/stores/notification'
import axios, {isAxiosError} from 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    isRefreshToken?: boolean
    _retry?: boolean
  }
}
const Http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})
const setNotification = (msg: string | undefined) => {
  const appStore = useNotificationStore()
  const message = msg || i18n.global.t('common.genericError')
  appStore.add({
    text: message,
    type: 'error'
  })
}
Http.interceptors.response.use(
  (response) => Promise.resolve(response),
  async (error) => {
    if (!isAxiosError(error)) return Promise.reject(error)
    const originalRequest = error.config
    if (!originalRequest) return Promise.reject(error)
    if (originalRequest.isRefreshToken) return Promise.reject(error)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const tokens = await authApi.refreshToken()
        useAuthStore().setAccessToken(tokens.access)
        if (originalRequest.headers)
          {originalRequest.headers.Authorization = `Bearer ${tokens.access}`}
        return Http.request(originalRequest)
      } catch {
        await forceLogoutRedirect()
        return Promise.reject(error)
      }
    }
    setNotification(getErrorMessage(error))
    return Promise.reject(error)
  }
)
function getErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  const data = error.response?.data as
    {message?: string | string[]; error?: string; detail?: string} | undefined
  if (!data) return undefined
  if (Array.isArray(data.message)) return data.message[0]
  return data.message || data.error || data.detail
}
export default Http
