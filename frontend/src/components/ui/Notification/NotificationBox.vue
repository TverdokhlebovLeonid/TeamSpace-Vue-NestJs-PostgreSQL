<script setup lang="ts">
import UiNotification from '@/components/ui/Notification/Notification.vue'
import {storeToRefs} from 'pinia'
import {useNotificationStore} from '@/stores/notification'

const store = useNotificationStore()
const {items} = storeToRefs(store)
</script>
<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      class="pointer-events-none fixed top-4 right-4 z-60 flex flex-col items-end gap-3"
      enter-active-class="notification-enter-active"
      enter-from-class="notification-enter-from"
      enter-to-class="notification-enter-to"
      leave-active-class="notification-leave-active"
      leave-from-class="notification-leave-from"
      leave-to-class="notification-leave-to"
      move-class="notification-move"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div
        v-for="message in items"
        :key="message.id"
        class="notification-shell pointer-events-auto"
      >
        <UiNotification
          :message="message"
          @close="store.remove(message.id)"
        />
      </div>
    </TransitionGroup>
  </Teleport>
</template>
<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition:
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 1rem));
}
.notification-enter-to,
.notification-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.notification-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
