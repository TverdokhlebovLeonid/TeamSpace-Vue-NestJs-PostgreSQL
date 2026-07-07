import {Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {APP_GUARD} from '@nestjs/core'
import {ThrottlerModule} from '@nestjs/throttler'
import {TypeOrmModule} from '@nestjs/typeorm'
import {HttpThrottlerGuard} from '@/common/guards/http-throttler.guard'
import {JwtAuthGuard} from '@/common/guards/jwt-auth.guard'
import {RolesGuard} from '@/common/guards/roles.guard'
import {configuration, type DatabaseConfig} from '@/config/configuration'
import {validateEnv} from '@/config/env.validation'
import {AuthModule} from '@/modules/auth/auth.module'
import {ChatModule} from '@/modules/chat/chat.module'
import {HealthModule} from '@/modules/health/health.module'
import {User} from '@/modules/users/user.entity'
import {UsersModule} from '@/modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv
    }),
    ThrottlerModule.forRoot([{ttl: 60_000, limit: 120}]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = configService.getOrThrow<DatabaseConfig>('database')
        return {
          type: 'postgres' as const,
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          entities: [User],
          migrations: [__dirname + '/database/migrations/*.{ts,js}'],
          migrationsRun: true,
          synchronize: false,
          autoLoadEntities: true
        }
      }
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    HealthModule
  ],
  providers: [
    {provide: APP_GUARD, useClass: HttpThrottlerGuard},
    {provide: APP_GUARD, useClass: JwtAuthGuard},
    {provide: APP_GUARD, useClass: RolesGuard}
  ]
})
export class AppModule {}
