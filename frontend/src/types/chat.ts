import type {components} from '@/api/schema'

type Schemas = components['schemas']

export type Conversation = Schemas['ConversationDto']
export type ConversationParticipant = Schemas['ConversationParticipantDto']
export type ChatMessage = Schemas['MessageDto']
export type Contact = Schemas['ContactDto']
export type CreateGroupPayload = Schemas['CreateGroupDto']
