import Http from '@/api/http'
export const setHeadersToken = (token: string | null) => {
  if (token) {
    Http.defaults.headers.Authorization = `Bearer ${token}`
    return
  }
  delete Http.defaults.headers.Authorization
}
