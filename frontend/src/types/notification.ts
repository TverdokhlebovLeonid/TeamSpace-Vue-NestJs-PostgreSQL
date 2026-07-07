export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export type NotificationMessage = {
  text: string
  type: NotificationType
  duration?: number
}
export type NotificationItem = NotificationMessage & {
  id: number
}
