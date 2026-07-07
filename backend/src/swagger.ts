import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import type {INestApplication} from '@nestjs/common'
import {DocumentBuilder, type OpenAPIObject, SwaggerModule} from '@nestjs/swagger'
export const buildOpenApiDocument = (app: INestApplication): OpenAPIObject => {
  const config = new DocumentBuilder()
    .setTitle('TeamSpace API')
    .setDescription('TeamSpace REST API — authentication, roles and user management.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
  return SwaggerModule.createDocument(app, config)
}

export interface SwaggerSetupOptions {
  serveUi: boolean
  writeToFile?: string
}

export const setupSwagger = (app: INestApplication, options: SwaggerSetupOptions): void => {
  const document = buildOpenApiDocument(app)
  if (options.serveUi) {
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      swaggerOptions: {persistAuthorization: true}
    })
  }
  if (options.writeToFile) {
    writeFileSync(join(process.cwd(), options.writeToFile), JSON.stringify(document, null, 2))
  }
}
