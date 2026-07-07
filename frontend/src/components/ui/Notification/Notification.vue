<script setup lang="ts">
import IconAlertCircle from '@/components/icon/AlertCircle.vue'
import IconAlertTriangle from '@/components/icon/AlertTriangle.vue'
import IconCheck from '@/components/icon/Check.vue'
import IconClose from '@/components/icon/Close.vue'
import IconInfoCircle from '@/components/icon/InfoCircle.vue'
import UiButtonIcon from '@/components/ui/UiButtonIcon.vue'
import type {NotificationItem, NotificationType} from '@/types/notification'
import {computed, onMounted, onUnmounted, type Component} from 'vue'
import {useI18n} from 'vue-i18n'

const props = defineProps<{
  message: NotificationItem
}>()
const emit = defineEmits<{
  close: []
}>()
const {t} = useI18n()
const styles: Record<NotificationType, string> = {
  success: 'bg-success text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-warning text-ink',
  info: 'bg-ink text-white'
}
const statusIcons: Record<NotificationType, Component> = {
  success: IconCheck,
  error: IconAlertCircle,
  warning: IconAlertTriangle,
  info: IconInfoCircle
}
const styleClass = computed(() => styles[props.message.type])
const StatusIcon = computed(() => statusIcons[props.message.type])
let timer: ReturnType<typeof setTimeout> | undefined
function dismiss() {
  if (timer) clearTimeout(timer)
  emit('close')
}
onMounted(() => {
  timer = setTimeout(dismiss, props.message.duration)
})
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>
<template>
  <div
    role="alert"
    class="flex w-80 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl p-4 shadow-soft"
    :class="styleClass"
  >
    <span
      class="grid size-8 shrink-0 place-items-center rounded-full bg-white/20"
      aria-hidden="true"
    >
      <component
        :is="StatusIcon"
        class="size-4"
      />
    </span>
    <p class="min-w-0 flex-1 text-sm font-medium leading-normal">
      {{ message.text }}
    </p>
    <UiButtonIcon
      class="shrink-0"
      variant="surface"
      size="sm"
      :label="t('common.close')"
      @click="dismiss"
    >
      <IconClose class="size-4" />
    </UiButtonIcon>
  </div>
</template>
