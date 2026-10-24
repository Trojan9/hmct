import { Prisma, PrismaClient } from '@prisma/client';
import { TaskRepository } from './task.repository';
import {
  ListTasksQuery,
  StatusCounts,
  TASK_STATUSES,
  Task,
  TaskInput,
  TaskStatus,
} from './task.types';

// Prisma's error code for "record to update/delete does not exist".
const RECORD_NOT_FOUND = 'P2025';

const isRecordNotFound = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND;

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(query: ListTasksQuery): Promise<{ items: Task[]; total: number }> {
    const where: Prisma.TaskWhereInput = query.status ? { status: query.status } : {};
    // Secondary sort on id keeps paging stable when the primary values are equal.
    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [
      { [query.sortBy]: query.order },
      { id: 'asc' },
    ];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);
    return { items, total };
  }

  async countByStatus(): Promise<StatusCounts> {
    const groups = await this.prisma.task.groupBy({ by: ['status'], _count: { _all: true } });
    const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as StatusCounts;
    for (const group of groups) {
      counts[group.status] = group._count._all;
    }
    return counts;
  }

  findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({ where: { id } });
  }

  create(input: TaskInput): Promise<Task> {
    return this.prisma.task.create({ data: input });
  }

  async update(id: string, input: TaskInput): Promise<Task | null> {
    try {
      return await this.prisma.task.update({ where: { id }, data: input });
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    try {
      return await this.prisma.task.update({ where: { id }, data: { status } });
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.task.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) return false;
      throw error;
    }
  }

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
