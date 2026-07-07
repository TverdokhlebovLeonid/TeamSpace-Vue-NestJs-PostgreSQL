import 'dotenv/config'
import 'reflect-metadata'
import * as bcrypt from 'bcryptjs'
import {UserLanguage, UserRole} from '../../common/enums/user-role.enum'
import {User} from '../../modules/users/user.entity'
import dataSource from '../data-source'

async function bootstrapAdmin(): Promise<void> {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? ''

  if (!username || !password) {
    throw new Error('Set BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD in the environment.')
  }

  await dataSource.initialize()
  try {
    const repo = dataSource.getRepository(User)
    const existingAdmin = await repo.findOne({where: {role: UserRole.ADMIN}})
    if (existingAdmin) {
      console.info('Administrator already exists — no changes made.')
      return
    }
    const admin = repo.create({
      username,
      email,
      role: UserRole.ADMIN,
      language: UserLanguage.EN,
      passwordHash: await bcrypt.hash(password, 12)
    })
    await repo.save(admin)

    console.info(`Created administrator: ${admin.username}`)
  } finally {
    await dataSource.destroy()
  }
}

bootstrapAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
