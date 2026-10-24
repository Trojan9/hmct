import pino from 'pino';

export const createLogger = (level: string) =>
  pino({
    level,
    base: { service: 'hmcts-task-api' },
    // Never write request bodies or auth headers to the logs.
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });

export type Logger = ReturnType<typeof createLogger>;
