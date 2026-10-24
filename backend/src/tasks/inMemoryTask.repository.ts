/* eslint-disable @typescript-eslint/require-await -- implements an async interface synchronously */
import { randomUUID } from 'node:crypto';
import { TaskRepository } from './task.repository';
import {
  ListTasksQuery,
  StatusCounts,
  TASK_STATUSES,
  Task,
  TaskInput,
  TaskStatus,
} from './task.types';

const compare = (a: Task, b: Task, field: ListTasksQuery['sortBy']): number => {
  // PostgreSQL orders enum values by declaration order, not alphabetically.
  if (field === 'status') return TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status);
  const left = a[field];
  const right = b[field];
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  return String(left).localeCompare(String(right));
};

/**
 * In-memory TaskRepository for tests and the zero-setup demo mode (TASK_STORE=memory). It mirrors the behaviour of
 * PrismaTaskRepository (sorting, paging, not-found handling) without a database.
 */
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async findMany(query: ListTasksQuery): Promise<{ items: Task[]; total: number }> {
    const direction = query.order === 'asc' ? 1 : -1;
    const matching = [...this.tasks.values()]
      .filter((task) => !query.status || task.status === query.status)
      .sort((a, b) => compare(a, b, query.sortBy) * direction || a.id.localeCompare(b.id));
    const start = (query.page - 1) * query.pageSize;
    return {
      items: matching.slice(start, start + query.pageSize).map((task) => ({ ...task })),
      total: matching.length,
    };
  }

  async countByStatus(): Promise<StatusCounts> {
    const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as StatusCounts;
    for (const task of this.tasks.values()) counts[task.status] += 1;
    return counts;
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  async create(input: TaskInput): Promise<Task> {
    const timestamp = this.now();
    const task: Task = { id: randomUUID(), ...input, createdAt: timestamp, updatedAt: timestamp };
    this.tasks.set(task.id, task);
    return { ...task };
  }

  async update(id: string, input: TaskInput): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    const updated: Task = { ...existing, ...input, updatedAt: this.now() };
    this.tasks.set(id, updated);
    return { ...updated };
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    return this.update(id, { ...existing, status });
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async ping(): Promise<void> {}
}
