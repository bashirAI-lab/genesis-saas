import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/shared/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './core/shared/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);

  // ─── Global Prefix ──────────────────────────────────────
  const prefix = `${configService.get('API_PREFIX', 'api')}/${configService.get('API_VERSION', 'v1')}`;
  app.setGlobalPrefix(prefix);

  // ─── Global Pipes ───────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,           // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Global Filters & Interceptors ──────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // ─── CORS ───────────────────────────────────────────────
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // ─── Swagger documentation ────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Genesis SaaS Multi-tenant API')
    .setDescription('The absolute foundation for modern vertical SaaS implementations.')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header', description: 'Tenant Slug or ID' }, 'x-tenant-id')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  // ─── Start Server ──────────────────────────────────────
  const port = configService.get<number>('APP_PORT', 3001);
  await app.listen(port);

  logger.log(`🚀 Server running on http://localhost:${port}/${prefix}`);
  logger.log(`📊 Environment: ${configService.get('APP_ENV', 'development')}`);
}

bootstrap();
