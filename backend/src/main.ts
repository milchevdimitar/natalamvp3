import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ErrorFilter } from './common/error.filter';
import { loadConfig } from './config';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.setGlobalPrefix('v1');
  app.enableCors({ origin: true }); // the Expo web build runs on another port
  app.useGlobalFilters(new ErrorFilter());
  app.enableShutdownHooks();

  // 0.0.0.0 so a phone on the same Wi-Fi can reach the API
  await app.listen(config.PORT, '0.0.0.0');
  console.log(`Natala API listening on http://localhost:${config.PORT}/v1`);
}

bootstrap();
