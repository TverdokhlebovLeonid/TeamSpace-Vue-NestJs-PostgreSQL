export interface AppConfig {
  nodeEnv: string
  isProduction: boolean
  port: number
  corsOrigins: string[]
  enableApiDocs: boolean
}

export interface JwtConfig {
  accessSecret: string
  refreshSecret: string
  accessTtl: string
  refreshTtl: string
}

export interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
}

const parseOrigins = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

export const configuration = () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  return {
    app: {
      nodeEnv,
      isProduction: nodeEnv === 'production',
      port: Number(process.env.PORT ?? 8000),
      corsOrigins: parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
      enableApiDocs: (process.env.ENABLE_API_DOCS ?? 'true').toLowerCase() === 'true'
    } satisfies AppConfig,
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d'
    } satisfies JwtConfig,
    database: {
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? '',
      password: process.env.POSTGRES_PASSWORD ?? '',
      database: process.env.POSTGRES_DB ?? ''
    } satisfies DatabaseConfig
  }
}

export type Configuration = ReturnType<typeof configuration>
