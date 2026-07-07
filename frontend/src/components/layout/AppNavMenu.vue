<script setup lang="ts">
import IconLogOut from '@/components/icon/LogOut.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiButtonIcon from '@/components/ui/UiButtonIcon.vue'
import {useAuthStore} from '@/stores/auth'
import {computed} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'

type NavItem = {
  labelKey: 'nav.chat' | 'nav.profile' | 'nav.users'
  to: string
  routeName: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {labelKey: 'nav.chat', to: '/', routeName: 'home'},
  {labelKey: 'nav.profile', to: '/profile', routeName: 'profile'},
  {labelKey: 'nav.users', to: '/admin/users', routeName: 'admin-users', adminOnly: true}
]

const authStore = useAuthStore()
const route = useRoute()
const {t} = useI18n()

const visibleNavItems = computed(() =>
  navItems.filter((item) => !item.adminOnly || authStore.isAdmin)
)

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <nav class="flex flex-wrap items-center gap-2">
    <UiButton
      v-for="item in visibleNavItems"
      :key="item.routeName"
      :label="t(item.labelKey)"
      variant="ghost"
      size="sm"
      :to="item.to"
      :active="route.name === item.routeName"
    />
    <UiButtonIcon
      :label="t('nav.logout')"
      variant="neutral"
      size="sm"
      @click="handleLogout"
    >
      <IconLogOut class="size-4" />
    </UiButtonIcon>
  </nav>
</template>
