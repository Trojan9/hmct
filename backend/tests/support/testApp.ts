import { createApp } from '../../src/app';
import { Config, loadConfig } from '../../src/config/env';
import { createLogger } from '../../src/lib/logger';
import { TaskRepository } from '../../src/tasks/task.repository';
import { TaskInput } from '../../src/tasks/task.types';
import { InMemoryTaskRepository } from '../../src/tasks/inMemoryTask.repository';

/** Fixed "now" so date rules are deterministic. */
export const NOW = new Date('2026-01-15T09:00:00.000Z');
export const clock = () => new Date(NOW);

export const FUTURE = '2026-02-01T10:00:00.000Z';
export const PAST = '2026-01-01T10:00:00.000Z';

export const buildTaskInput = (overrides: Partial<TaskInput> = {}): TaskInput => ({
  title: 'Review hearing bundle',
  description: 'Check every page is indexed',
  status: 'PENDING',
  dueDate: new Date(FUTURE),
  ...overrides,
});

export const buildTestApp = (
  options: { repository?: TaskRepository; config?: Partial<Config> } = {},
) => {
  const repository = options.repository ?? new InMemoryTaskRepository(clock);
  const config = { ...loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }), ...options.config };
  const app = createApp({
    config,
    logger: createLogger(config.LOG_LEVEL),
    taskRepository: repository,
    now: clock,
  });
  return { app, repository };
};
