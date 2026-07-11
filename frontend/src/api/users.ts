import {API_AUTH_PREFIX} from '@/api/constants'
import Http from '@/api/http'
import type {AppLanguage, CreateUserPayload, UpdateUserPayload, User, UserRole} from '@/types/auth'
import type {Contact} from '@/types/chat'

export const getMe = async () => {
  const {data} = await Http.get<User>(`${API_AUTH_PREFIX}/me`)
  return data
}

export const updateMe = async (payload: {language: AppLanguage}) => {
  const {data} = await Http.patch<User>(`${API_AUTH_PREFIX}/me`, payload)
  return data
}

export const changePassword = async (payload: {currentPassword: string; newPassword: string}) => {
  const {data} = await Http.post<{detail: string}>(`${API_AUTH_PREFIX}/me/password`, payload)
  return data
}

export const list = async () => {
  const {data} = await Http.get<User[]>(`${API_AUTH_PREFIX}/users`)
  return data
}

export const create = async (payload: CreateUserPayload) => {
  const {data} = await Http.post<User>(`${API_AUTH_PREFIX}/users`, payload)
  return data
}

export const remove = async (id: string) => {
  await Http.delete(`${API_AUTH_PREFIX}/users/${id}`)
}

export const update = async (id: string, payload: UpdateUserPayload) => {
  const {data} = await Http.patch<User>(`${API_AUTH_PREFIX}/users/${id}`, payload)
  return data
}

export const changeRole = async (id: string, role: UserRole) => {
  const {data} = await Http.patch<User>(`${API_AUTH_PREFIX}/users/${id}/role`, {role})
  return data
}

export const contacts = async () => {
  const {data} = await Http.get<Contact[]>(`${API_AUTH_PREFIX}/contacts`)
  return data
}
