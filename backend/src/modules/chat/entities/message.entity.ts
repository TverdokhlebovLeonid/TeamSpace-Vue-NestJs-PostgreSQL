import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import {Conversation} from '@/modules/chat/entities/conversation.entity'
import {User} from '@/modules/users/user.entity'

@Entity({name: 'messages'})
@Index('IDX_messages_conversation_created', ['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({name: 'conversation_id', type: 'uuid'})
  conversationId!: string

  @Column({name: 'sender_id', type: 'uuid'})
  senderId!: string

  @Column({type: 'text'})
  content!: string

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'conversation_id'})
  conversation!: Conversation

  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'sender_id'})
  sender!: User

  @CreateDateColumn({name: 'created_at', type: 'timestamptz'})
  createdAt!: Date
}
