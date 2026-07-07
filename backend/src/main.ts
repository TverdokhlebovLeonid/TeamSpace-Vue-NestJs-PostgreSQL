import {Logger, ValidationPipe} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {NestFactory} from '@nestjs/core'
import type {NestExpressApplication} from '@nestjs/platform-express'
import {WsAdapter} from '@nestjs/platform-ws'
import cookieParser from 'cookie-parser'
import {AppModule} from '@/app.module'
import type {AppConfig} from '@/config/configuration'
import {setupSwagger} from '@/swagger'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {bufferLogs: false})
  const configService = app.get(ConfigService)
  const appConfig = configService.getOrThrow<AppConfig>('app')

  app.set('trust proxy', 1)
  app.use(cookieParser())
  app.useWebSocketAdapter(new WsAdapter(app))
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: appConfig.corsOrigins.length ? appConfig.corsOrigins : true,
    credentials: true
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {enableImplicitConversion: true}
    })
  )
  app.enableShutdownHooks()

  setupSwagger(app, {
    serveUi: appConfig.enableApiDocs,
    writeToFile: appConfig.isProduction ? undefined : 'openapi.json'
  })

  await app.listen(appConfig.port, '0.0.0.0')
  const logger = new Logger('Bootstrap')
  logger.log(`TeamSpace API listening on http://0.0.0.0:${appConfig.port}/api`)
  if (appConfig.enableApiDocs) {
    logger.log(`Swagger UI available at http://0.0.0.0:${appConfig.port}/api/docs`)
  }
}

void bootstrap()
