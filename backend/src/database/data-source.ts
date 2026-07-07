import 'dotenv/config'
import 'reflect-metadata'
import {DataSource, type DataSourceOptions} from 'typeorm'
import {ConversationMember} from '../modules/chat/entities/conversation-member.entity'
import {Conversation} from '../modules/chat/entities/conversation.entity'
import {Message} from '../modules/chat/entities/message.entity'
import {User} from '../modules/users/user.entity'
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'teamspace_user',
  password: process.env.POSTGRES_PASSWORD ?? 'teamspace_password',
  database: process.env.POSTGRES_DB ?? 'teamspace_app',
  entities: [User, Conversation, ConversationMember, Message],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false
}

const dataSource = new DataSource(dataSourceOptions)
export default dataSource
