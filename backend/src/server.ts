import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { loadConfig } from './config/env';
import { createLogger } from './lib/logger';
import { demoTasks } from './tasks/demoTasks';
import { InMemoryTaskRepository } from './tasks/inMemoryTask.repository';
import { PrismaTaskRepository } from './tasks/prismaTask.repository';
import { TaskRepository } from './tasks/task.repository';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);

/**
 * TASK_STORE=memory runs the API without a database, loaded with demo tasks.
 * Data is lost on restart, so it is for trying the app out, not for real use.
 */
const createRepository = async (): Promise<{
  repository: TaskRepository;
  close: () => Promise<void>;
}> => {
  if (config.TASK_STORE === 'memory') {
    const repository = new InMemoryTaskRepository();
    for (const task of demoTasks()) await repository.create(task);
    logger.warn('Using the in-memory task store: data will be lost when the API stops');
    return { repository, close: async () => {} };
  }
  const prisma = new PrismaClient();
  return { repository: new PrismaTaskRepository(prisma), close: () => prisma.$disconnect() };
};

const start = async () => {
  const { repository, close } = await createRepository();
  const app = createApp({ config, logger, taskRepository: repository });

  const server = app.listen(config.PORT, () => {
    logger.info(
      { port: config.PORT, env: config.NODE_ENV, store: config.TASK_STORE },
      'Task API listening',
    );
  });

  // Stop accepting connections, let in-flight requests finish, then close the pool.
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      void close().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

void start();
