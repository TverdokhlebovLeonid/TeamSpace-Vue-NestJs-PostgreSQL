import {useAuthStore} from '@/stores/auth'
import type {RouteLocationNormalized} from 'vue-router'
export async function authGuard(to: RouteLocationNormalized) {
  const authStore = useAuthStore()
  if (!authStore.initialized) await authStore.initialize()
  const requiresAuth =
    to.meta.requiresAuth === true || to.matched.some((record) => record.meta.requiresAuth === true)
  const guestOnly = to.meta.guestOnly === true
  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: to.fullPath !== '/' ? {redirect: to.fullPath} : undefined,
      replace: true
    }
  }
  if (guestOnly && authStore.isAuthenticated) return {name: 'home', replace: true}
  return true
}
