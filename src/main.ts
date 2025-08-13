import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '50mb' }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Nomad Challenge API')
    .setDescription(
      'API documentation for the Nomad Challenge game statistics and file upload system',
    )
    .setVersion('1.0')
    .addTag('statistics', 'Game statistics endpoints')
    .addTag('uploads', 'File upload endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
