import {useAuthStore} from '@/stores/auth'
import type {RouteLocationNormalized} from 'vue-router'
export async function adminGuard(to: RouteLocationNormalized) {
  const authStore = useAuthStore()
  if (!authStore.initialized) await authStore.initialize()
  if (!authStore.isAuthenticated) return {name: 'login', query: {redirect: to.fullPath}}
  if (!authStore.isAdmin) return {name: 'home'}
  return true
}
