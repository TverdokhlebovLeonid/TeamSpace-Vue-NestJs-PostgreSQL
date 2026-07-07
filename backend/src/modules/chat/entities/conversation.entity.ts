import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import {ConversationType} from '@/common/enums/chat.enum'
import {ConversationMember} from '@/modules/chat/entities/conversation-member.entity'
import {Message} from '@/modules/chat/entities/message.entity'

@Entity({name: 'conversations'})
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({type: 'enum', enum: ConversationType})
  type!: ConversationType

  @Column({type: 'varchar', length: 150, nullable: true})
  title!: string | null

  @Column({name: 'created_by', type: 'uuid'})
  createdBy!: string

  @Index({unique: true, where: '"direct_key" IS NOT NULL'})
  @Column({name: 'direct_key', type: 'varchar', length: 73, nullable: true})
  directKey!: string | null

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members!: ConversationMember[]

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[]

  @CreateDateColumn({name: 'created_at', type: 'timestamptz'})
  createdAt!: Date

  @UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
  updatedAt!: Date
}
