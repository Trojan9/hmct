import { ListTasksQuery, StatusCounts, Task, TaskInput, TaskStatus } from './task.types';

/**
 * Persistence boundary for tasks. The service depends on this interface rather
 * than on Prisma, so business rules can be unit tested without a database.
 */
export interface TaskRepository {
  findMany(query: ListTasksQuery): Promise<{ items: Task[]; total: number }>;
  countByStatus(): Promise<StatusCounts>;
  findById(id: string): Promise<Task | null>;
  create(input: TaskInput): Promise<Task>;
  /** Returns null when no task has the given id. */
  update(id: string, input: TaskInput): Promise<Task | null>;
  /** Returns null when no task has the given id. */
  updateStatus(id: string, status: TaskStatus): Promise<Task | null>;
  /** Returns false when no task has the given id. */
  delete(id: string): Promise<boolean>;
  /** Throws if the underlying store cannot be reached. */
  ping(): Promise<void>;
}
