import {plainToInstance} from 'class-transformer'
import {IsEnum, IsNotEmpty, IsOptional, IsString, validateSync} from 'class-validator'
export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test'
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development

  @IsOptional()
  @IsString()
  PORT?: string

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL?: string

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL?: string

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB!: string

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER!: string

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD!: string

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST!: string

  @IsOptional()
  @IsString()
  POSTGRES_PORT?: string

  @IsOptional()
  @IsString()
  CORS_ALLOWED_ORIGINS?: string

  @IsOptional()
  @IsString()
  ENABLE_API_DOCS?: string
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false
  })
  const errors = validateSync(validated, {skipMissingProperties: false})
  if (errors.length) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ')
    throw new Error(`Invalid environment configuration: ${details}`)
  }
  return validated
}
