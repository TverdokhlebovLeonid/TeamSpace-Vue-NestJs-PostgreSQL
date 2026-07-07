import {API_AUTH_PREFIX, CSRF_COOKIE_NAME, CSRF_HEADER_NAME} from '@/api/constants'
import Http from '@/api/http'
import {setHeadersToken} from '@/services/authToken'
import type {AuthTokens, LoginCredentials} from '@/types/auth'
import {getCookie} from '@/utils/cookies'

const csrfHeaders = (): Record<string, string> => {
  const token = getCookie(CSRF_COOKIE_NAME)
  return token ? {[CSRF_HEADER_NAME]: token} : {}
}

export const login = async (credentials: LoginCredentials) => {
  const {data} = await Http.post<AuthTokens>(`${API_AUTH_PREFIX}/jwt/create`, credentials)
  if (data.access) setHeadersToken(data.access)
  return data
}

export const refreshToken = async () => {
  const {data} = await Http.post<AuthTokens>(`${API_AUTH_PREFIX}/jwt/refresh`, null, {
    isRefreshToken: true,
    headers: csrfHeaders()
  })
  if (data.access) setHeadersToken(data.access)
  return data
}

export const logout = async () => {
  await Http.post(`${API_AUTH_PREFIX}/jwt/logout`, null, {headers: csrfHeaders()})
}
