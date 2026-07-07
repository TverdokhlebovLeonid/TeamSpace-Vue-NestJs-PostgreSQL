import {API_BASE_URL} from '@/api/constants'
import {type AuthOkPayload, ClientEvent, ServerEvent, type WsEnvelope} from '@/api/ws/protocol'

const WS_CLOSE_UNAUTHORIZED = 4401
const REAUTH_SKEW_MS = 30_000
const HEARTBEAT_INTERVAL_MS = 25_000
const PONG_TIMEOUT_MS = 10_000
const MAX_RECONNECT_ATTEMPTS = 8
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

export type SocketStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed'
export interface SocketClientOptions {
  getToken: () => string | null
  refreshToken: () => Promise<string>
  onSessionExpired: () => void
  onStatusChange?: (status: SocketStatus) => void
}

type Listener = (data: unknown) => void

function resolveWsUrl(): string {
  if (API_BASE_URL) return `${API_BASE_URL.replace(/^http/, 'ws')}/api/ws`
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/ws`
}

export class SocketClient {
  private socket: WebSocket | null = null
  private status: SocketStatus = 'idle'
  private readonly listeners = new Map<string, Set<Listener>>()

  private manualClose = false
  private reconnectAttempts = 0
  private reauthing = false

  private reauthTimer?: ReturnType<typeof setTimeout>
  private reconnectTimer?: ReturnType<typeof setTimeout>
  private heartbeatTimer?: ReturnType<typeof setInterval>
  private pongTimer?: ReturnType<typeof setTimeout>

  constructor(private readonly options: SocketClientOptions) {}

  getStatus(): SocketStatus {
    return this.status
  }

  connect(): void {
    if (this.socket && (this.status === 'open' || this.status === 'connecting')) return
    if (!this.options.getToken()) return
    this.manualClose = false
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting')

    const socket = new WebSocket(resolveWsUrl())
    this.socket = socket
    socket.onopen = () => this.handleOpen()
    socket.onmessage = (event) => this.handleMessage(event)
    socket.onclose = (event) => this.handleClose(event)
    socket.onerror = () => {}
  }

  disconnect(): void {
    this.manualClose = true
    this.clearAllTimers()
    if (this.socket) {
      try {
        this.socket.close(1000, 'client_disconnect')
      } catch {}
    }
    this.socket = null
    this.setStatus('closed')
  }

  send(event: string, data: unknown): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({event, data}))
      return true
    }
    return false
  }

  on(event: string, listener: Listener): () => void {
    const set = this.listeners.get(event) ?? new Set<Listener>()
    set.add(listener)
    this.listeners.set(event, set)
    return () => set.delete(listener)
  }

  private handleOpen(): void {
    this.setStatus('open')
    this.reconnectAttempts = 0
    const token = this.options.getToken()
    if (!token) {
      this.disconnect()
      return
    }
    this.send(ClientEvent.Auth, {token})
    this.startHeartbeat()
  }

  private handleMessage(event: MessageEvent): void {
    let envelope: WsEnvelope
    try {
      envelope = JSON.parse(event.data as string) as WsEnvelope
    } catch {
      return
    }
    switch (envelope.event) {
      case ServerEvent.AuthOk:
        this.scheduleReauth((envelope.data as AuthOkPayload).expiresAt)
        break
      case ServerEvent.Pong:
        this.clearPongTimer()
        break
      case ServerEvent.AuthError:
        break
      default:
        break
    }
    this.emit(envelope.event, envelope.data)
  }

  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat()
    this.clearReauthTimer()
    this.socket = null
    if (this.manualClose) {
      this.setStatus('closed')
      return
    }
    if (event.code === WS_CLOSE_UNAUTHORIZED) {
      void this.recoverWithRefresh()
      return
    }
    this.scheduleReconnect()
  }

  private async recoverWithRefresh(): Promise<void> {
    if (this.reauthing) return
    this.reauthing = true
    try {
      await this.options.refreshToken()
      this.reauthing = false
      this.scheduleReconnect(true)
    } catch {
      this.reauthing = false
      this.manualClose = true
      this.setStatus('closed')
      this.options.onSessionExpired()
    }
  }

  private scheduleReauth(expiresAt: number | null): void {
    this.clearReauthTimer()
    if (!expiresAt) return
    const delay = Math.max(0, expiresAt - Date.now() - REAUTH_SKEW_MS)
    this.reauthTimer = setTimeout(() => void this.reauthNow(), delay)
  }

  private async reauthNow(): Promise<void> {
    if (this.socket?.readyState !== WebSocket.OPEN) return
    try {
      const token = await this.options.refreshToken()
      this.send(ClientEvent.Reauth, {token})
    } catch {}
  }

  private scheduleReconnect(immediate = false): void {
    if (this.manualClose || !this.options.getToken()) {
      this.setStatus('closed')
      return
    }
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.setStatus('closed')
      this.options.onSessionExpired()
      return
    }
    this.reconnectAttempts += 1
    this.setStatus('reconnecting')
    const backoff = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * 2 ** (this.reconnectAttempts - 1)
    )
    const jitter = Math.random() * RECONNECT_BASE_MS
    const delay = immediate ? 0 : backoff + jitter
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) return
      this.send(ClientEvent.Ping, {})
      this.pongTimer = setTimeout(() => {
        try {
          this.socket?.close(4000, 'heartbeat_timeout')
        } catch {}
      }, PONG_TIMEOUT_MS)
    }, HEARTBEAT_INTERVAL_MS)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
    this.clearPongTimer()
  }

  private clearPongTimer(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = undefined
    }
  }

  private clearReauthTimer(): void {
    if (this.reauthTimer) {
      clearTimeout(this.reauthTimer)
      this.reauthTimer = undefined
    }
  }

  private clearAllTimers(): void {
    this.stopHeartbeat()
    this.clearReauthTimer()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  private emit(event: string, data: unknown): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of set) {
      listener(data)
    }
  }

  private setStatus(status: SocketStatus): void {
    if (this.status === status) return
    this.status = status
    this.options.onStatusChange?.(status)
  }
}
