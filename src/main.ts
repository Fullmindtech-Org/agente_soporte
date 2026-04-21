import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Servir archivos estáticos desde /public → accesible en /widget.html, etc.
  app.useStaticAssets(join(process.cwd(), 'public'));

  // CORS: permitir el widget en localhost y en producción
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });

  // Permitir embebido en iframes de cualquier origen
  // (restringir con ALLOWED_FRAME_ANCESTORS en producción)
  const frameAncestors = process.env.ALLOWED_FRAME_ANCESTORS ?? '*';
  app.use((_req, res, next) => {
    res.removeHeader('X-Frame-Options'); // Nest/Express lo pone por defecto
    res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Agente de Soporte escuchando en el puerto ${port}`);
  logger.log(`Webhook WhatsApp: POST /webhooks/whatsapp`);
  logger.log(`Webhook Plane:    POST /webhooks/plane`);
  logger.log(`Chat web:         POST /chat`);
  logger.log(`Widget web:       GET  /widget.html`);
}
bootstrap();
