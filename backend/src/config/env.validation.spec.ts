import {validateEnv} from '@/config/env.validation'

describe('validateEnv', () => {
  const valid = {
    JWT_ACCESS_SECRET: 'access',
    JWT_REFRESH_SECRET: 'refresh',
    POSTGRES_DB: 'db',
    POSTGRES_USER: 'user',
    POSTGRES_PASSWORD: 'pass',
    POSTGRES_HOST: 'localhost'
  }

  it('accepts a valid environment', () => {
    expect(validateEnv(valid).JWT_ACCESS_SECRET).toBe('access')
  })

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    expect(() => validateEnv({...valid, JWT_ACCESS_SECRET: ''})).toThrow(
      /Invalid environment configuration/
    )
  })
})
