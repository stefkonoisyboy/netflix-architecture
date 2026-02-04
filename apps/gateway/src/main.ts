import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
  console.log('🚀 Gateway running on http://localhost:3000');
  console.log('📊 Dashboard SSE endpoint: http://localhost:3000/dashboard/stream');
}

bootstrap();
