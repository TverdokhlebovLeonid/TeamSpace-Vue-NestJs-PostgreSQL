import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import {UserLanguage, UserRole} from '@/common/enums/user-role.enum'

@Entity({name: 'users'})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({unique: true})
  @Column({type: 'varchar', length: 150})
  username!: string

  @Column({type: 'varchar', length: 254, default: ''})
  email!: string

  @Column({name: 'first_name', type: 'varchar', length: 150, default: ''})
  firstName!: string

  @Column({name: 'last_name', type: 'varchar', length: 150, default: ''})
  lastName!: string

  @Column({name: 'password_hash', type: 'varchar', length: 255})
  passwordHash!: string

  @Column({type: 'enum', enum: UserRole, default: UserRole.USER})
  role!: UserRole

  @Column({type: 'enum', enum: UserLanguage, default: UserLanguage.EN})
  language!: UserLanguage

  @CreateDateColumn({name: 'created_at', type: 'timestamptz'})
  createdAt!: Date

  @UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
  updatedAt!: Date
}
