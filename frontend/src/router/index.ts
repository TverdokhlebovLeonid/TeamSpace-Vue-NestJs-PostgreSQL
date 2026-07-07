import {adminGuard} from '@/router/guards/adminGuard'
import {authGuard} from '@/router/guards/authGuard'
import {i18n} from '@/i18n'
import {createRouter, createWebHistory} from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return {top: 0}
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: {titleKey: 'login.submit', guestOnly: true}
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: {requiresAuth: true},
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: {titleKey: 'nav.chat'}
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: {titleKey: 'nav.profile'}
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('@/views/admin/UsersAdminView.vue'),
          meta: {titleKey: 'nav.users', requiresAdmin: true}
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: () => ({name: 'home', replace: true})
    }
  ]
})
router.beforeEach(async (to) => {
  const titleKey = typeof to.meta.titleKey === 'string' ? to.meta.titleKey : 'app.name'
  document.title = `${i18n.global.t(titleKey)} | ${i18n.global.t('app.name')}`
  if (to.matched.some((record) => record.meta.requiresAdmin)) return adminGuard(to)
  return authGuard(to)
})
export default router
