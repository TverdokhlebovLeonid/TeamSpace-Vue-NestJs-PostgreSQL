import type {AppLanguage, UserRole} from '@/types/auth'

export type EditUserForm = {
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  language: AppLanguage
}

export type FormFieldKey = keyof EditUserForm

export type FormField =
  | {
      key: FormFieldKey
      kind: 'input'
      labelKey: string
      placeholderKey?: string
      type?: string
      required?: boolean
      error?: string
    }
  | {
      key: FormFieldKey
      kind: 'select'
      labelKey: string
      options: {value: string; label: string}[]
    }
