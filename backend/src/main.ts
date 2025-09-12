import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // 전역 유효성 검사 파이프 추가
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
