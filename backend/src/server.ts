import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { loadConfig } from './config/env';
import { createLogger } from './lib/logger';
import { PrismaTaskRepository } from './tasks/prismaTask.repository';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const prisma = new PrismaClient();

const app = createApp({ config, logger, taskRepository: new PrismaTaskRepository(prisma) });

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Task API listening');
});

// Stop accepting connections, let in-flight requests finish, then close the pool.
const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
