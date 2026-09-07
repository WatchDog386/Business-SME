import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

let app: any;

async function createApp() {
  if (app) return app;
  
  app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: (config.get('corsOrigin') as string[] | undefined) ?? true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();
  return app;
}

export default async function handler(req: any, res: any) {
  const nestApp = await createApp();
  return nestApp.getHttpAdapter().getInstance()(req, res);
}