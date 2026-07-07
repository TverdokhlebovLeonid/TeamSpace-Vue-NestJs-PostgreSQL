import en from '@/i18n/locales/en'
import ru from '@/i18n/locales/ru'
import {getDataFromStorage, saveDataInStorage} from '@/services/localStorage'
import type {AppLanguage} from '@/types/auth'
import {createI18n} from 'vue-i18n'
export type {AppLanguage}
export const LANGUAGE_STORAGE_KEY = 'TEAMSPACE_LANGUAGE'
export const DEFAULT_LANGUAGE: AppLanguage = 'en'
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'ru']
export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LANGUAGE,
  fallbackLocale: DEFAULT_LANGUAGE,
  messages: {
    en,
    ru
  }
})
export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'en' || value === 'ru'
}
export function readGuestLanguage(): AppLanguage {
  const stored = getDataFromStorage<string>(LANGUAGE_STORAGE_KEY)
  return isAppLanguage(stored) ? stored : DEFAULT_LANGUAGE
}
export function saveGuestLanguage(language: AppLanguage) {
  saveDataInStorage(LANGUAGE_STORAGE_KEY, language)
}
export function applyLocale(language: AppLanguage) {
  i18n.global.locale.value = language
  document.documentElement.lang = language
}
export function resolveUserLanguage(language: string | null | undefined): AppLanguage {
  return isAppLanguage(language) ? language : DEFAULT_LANGUAGE
}
