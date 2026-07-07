import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {NestFactory} from '@nestjs/core'
import {WsAdapter} from '@nestjs/platform-ws'
import {AppModule} from '@/app.module'
import {buildOpenApiDocument} from '@/swagger'

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, {logger: false})
  app.useWebSocketAdapter(new WsAdapter(app))
  app.setGlobalPrefix('api')
  await app.init()
  const document = buildOpenApiDocument(app)
  const target = join(process.cwd(), 'openapi.json')
  writeFileSync(target, JSON.stringify(document, null, 2))
  await app.close()

  console.info(`OpenAPI specification written to ${target}`)
}

generate().catch((error) => {
  console.error('Failed to generate OpenAPI specification:', error)
  process.exit(1)
})
