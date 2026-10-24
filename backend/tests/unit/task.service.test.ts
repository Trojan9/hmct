import { NotFoundError, ValidationError } from '../../src/errors/AppError';
import { TaskService } from '../../src/tasks/task.service';
import { ListTasksQuery } from '../../src/tasks/task.types';
import { InMemoryTaskRepository } from '../../src/tasks/inMemoryTask.repository';
import { NOW, PAST, buildTaskInput, clock } from '../support/testApp';

const defaultQuery: ListTasksQuery = { sortBy: 'dueDate', order: 'asc', page: 1, pageSize: 20 };

describe('TaskService', () => {
  let repository: InMemoryTaskRepository;
  let service: TaskService;

  beforeEach(() => {
    repository = new InMemoryTaskRepository(clock);
    service = new TaskService(repository, clock);
  });

  describe('create', () => {
    it('creates a task due in the future', async () => {
      const task = await service.create(buildTaskInput());

      expect(task).toMatchObject({ title: 'Review hearing bundle', status: 'PENDING' });
      expect(await repository.findById(task.id)).toEqual(task);
    });

    it('rejects a due date in the past', async () => {
      await expect(service.create(buildTaskInput({ dueDate: new Date(PAST) }))).rejects.toEqual(
        new ValidationError([{ field: 'dueDate', message: 'Due date must be in the future' }]),
      );
    });

    it('rejects a due date equal to now', async () => {
      await expect(
        service.create(buildTaskInput({ dueDate: new Date(NOW) })),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('uses the real clock when none is given', async () => {
      const realClockService = new TaskService(repository);
      await expect(
        realClockService.create(buildTaskInput({ dueDate: new Date('2000-01-01T00:00:00Z') })),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('get', () => {
    it('returns the task', async () => {
      const created = await service.create(buildTaskInput());
      await expect(service.get(created.id)).resolves.toEqual(created);
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.get('missing')).rejects.toEqual(
        new NotFoundError('Task missing was not found'),
      );
    });
  });

  describe('replace', () => {
    it('replaces every editable field', async () => {
      const created = await service.create(buildTaskInput());
      const updated = await service.replace(created.id, {
        title: 'New title',
        description: null,
        status: 'IN_PROGRESS',
        dueDate: new Date(PAST),
      });

      expect(updated).toMatchObject({
        id: created.id,
        title: 'New title',
        description: null,
        status: 'IN_PROGRESS',
        dueDate: new Date(PAST),
      });
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.replace('missing', buildTaskInput())).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('updateStatus', () => {
    it('changes only the status', async () => {
      const created = await service.create(buildTaskInput());
      const updated = await service.updateStatus(created.id, 'COMPLETED');

      expect(updated).toEqual({ ...created, status: 'COMPLETED', updatedAt: updated.updatedAt });
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.updateStatus('missing', 'COMPLETED')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('removes the task', async () => {
      const created = await service.create(buildTaskInput());
      await service.delete(created.id);
      await expect(repository.findById(created.id)).resolves.toBeNull();
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('list', () => {
    it('returns an empty first page when there are no tasks', async () => {
      await expect(service.list(defaultQuery)).resolves.toEqual({
        data: [],
        meta: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 1,
          statusCounts: { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 },
        },
      });
    });

    it('pages results and counts every status regardless of the filter', async () => {
      for (let day = 1; day <= 5; day += 1) {
        await service.create(
          buildTaskInput({ title: `Task ${day}`, dueDate: new Date(`2026-02-0${day}T10:00:00Z`) }),
        );
      }
      await service.create(buildTaskInput({ title: 'Done', status: 'COMPLETED' }));

      const page = await service.list({ ...defaultQuery, status: 'PENDING', pageSize: 2, page: 2 });

      expect(page.data.map((task) => task.title)).toEqual(['Task 3', 'Task 4']);
      expect(page.meta).toEqual({
        page: 2,
        pageSize: 2,
        total: 5,
        totalPages: 3,
        statusCounts: { PENDING: 5, IN_PROGRESS: 0, COMPLETED: 1, CANCELLED: 0 },
      });
    });
  });
});
