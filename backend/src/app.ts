import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { Config } from './config/env';
import { openApiDocument } from './docs/openapi';
import { createHealthRouter } from './health/health.routes';
import { Logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { TaskRepository } from './tasks/task.repository';
import { createTaskRouter } from './tasks/task.routes';
import { TaskService } from './tasks/task.service';

export interface AppDependencies {
  config: Config;
  logger: Logger;
  taskRepository: TaskRepository;
  now?: () => Date;
}

/**
 * Builds the Express app from its dependencies. Nothing here opens a port or
 * a database connection, so tests can create an app with fakes.
 */
export const createApp = ({ config, logger, taskRepository, now }: AppDependencies): Express => {
  const app = express();
  const taskService = new TaskService(taskRepository, now);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.headers['x-request-id']?.toString() || randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', createHealthRouter(taskRepository));

  app.get('/api-docs.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: config.RATE_LIMIT_MAX,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          error: {
            status: 429,
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Try again later.',
          },
        });
      },
    }),
  );
  app.use('/api/tasks', createTaskRouter(taskService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
