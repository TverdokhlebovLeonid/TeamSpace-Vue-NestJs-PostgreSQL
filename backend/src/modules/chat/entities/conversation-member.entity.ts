import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm'
import {ConversationMemberRole} from '@/common/enums/chat.enum'
import {Conversation} from '@/modules/chat/entities/conversation.entity'
import {User} from '@/modules/users/user.entity'

@Entity({name: 'conversation_members'})
@Unique('UQ_member_conversation_user', ['conversationId', 'userId'])
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({name: 'conversation_id', type: 'uuid'})
  conversationId!: string

  @Index()
  @Column({name: 'user_id', type: 'uuid'})
  userId!: string

  @Column({type: 'enum', enum: ConversationMemberRole, default: ConversationMemberRole.MEMBER})
  role!: ConversationMemberRole

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'conversation_id'})
  conversation!: Conversation

  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user!: User

  @CreateDateColumn({name: 'joined_at', type: 'timestamptz'})
  joinedAt!: Date
}
