import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContainer } from './infrastructure/di/container';
import { createContext } from './presentation/trpc/context';
import { createAppRouter } from './presentation/trpc/router';
import { logger } from './infrastructure/config/logger';
import { env } from './infrastructure/config/env';
import { registerRestApi } from './presentation/rest/api.plugin';

async function bootstrap() {
  const container = createContainer();
  const appRouter = createAppRouter(container);
  const createContextFn = createContext(container);

  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: createContextFn,
      onError: ({ error }: { error: Error }) => {
        logger.error({ err: error }, 'tRPC error');
      },
    },
  });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await registerRestApi(app, container);

  const port = env.PORT;
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`🚀 Servidor corriendo en puerto ${port}`);
}

bootstrap().catch((err) => {
  logger.error(err, 'Error al iniciar el servidor');
  process.exit(1);
});
