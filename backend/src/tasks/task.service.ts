import { NotFoundError, ValidationError } from '../errors/AppError';
import { TaskRepository } from './task.repository';
import { ListTasksQuery, Task, TaskInput, TaskPage, TaskStatus } from './task.types';

export const taskNotFound = (id: string) => new NotFoundError(`Task ${id} was not found`);

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: ListTasksQuery): Promise<TaskPage> {
    const [{ items, total }, statusCounts] = await Promise.all([
      this.repository.findMany(query),
      this.repository.countByStatus(),
    ]);
    return {
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        statusCounts,
      },
    };
  }

  async get(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) throw taskNotFound(id);
    return task;
  }

  /**
   * New tasks must be due in the future. Existing tasks may keep (or be edited
   * with) a past due date so that overdue work can still be managed.
   */
  async create(input: TaskInput): Promise<Task> {
    if (input.dueDate.getTime() <= this.now().getTime()) {
      throw new ValidationError([{ field: 'dueDate', message: 'Due date must be in the future' }]);
    }
    return this.repository.create(input);
  }

  async replace(id: string, input: TaskInput): Promise<Task> {
    const task = await this.repository.update(id, input);
    if (!task) throw taskNotFound(id);
    return task;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.repository.updateStatus(id, status);
    if (!task) throw taskNotFound(id);
    return task;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw taskNotFound(id);
  }
}
