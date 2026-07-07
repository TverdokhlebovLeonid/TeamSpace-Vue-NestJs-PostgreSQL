import type {components} from '@/api/schema'

type Schemas = components['schemas']

export type UserRole = Schemas['UserRole']
export type AppLanguage = Schemas['UserLanguage']
export type User = Schemas['UserDto']
export type AuthTokens = Schemas['AccessTokenDto']
export type LoginCredentials = Schemas['LoginDto']
export type CreateUserPayload = Schemas['CreateUserDto']
