import { PrismaClient } from '@prisma/client';
import { PrismaTaskRepository } from '../../src/tasks/prismaTask.repository';
import { buildTaskInput } from '../support/testApp';

/**
 * Runs against a real PostgreSQL database. CI provides one as a service
 * container and applies the migrations first; locally use `docker compose up db`.
 * Never point DATABASE_URL at a database whose data you want to keep.
 */
describe('PrismaTaskRepository (PostgreSQL)', () => {
  const prisma = new PrismaClient();
  const repository = new PrismaTaskRepository(prisma);

  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.$disconnect();
  });

  it('creates and finds a task', async () => {
    const created = await repository.create(buildTaskInput());

    await expect(repository.findById(created.id)).resolves.toEqual(created);
    expect(created).toMatchObject({ title: 'Review hearing bundle', status: 'PENDING' });
  });

  it('returns null for an unknown id', async () => {
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('filters, sorts and pages', async () => {
    for (const [title, day] of [
      ['C', 3],
      ['A', 1],
      ['B', 2],
    ] as const) {
      await repository.create(
        buildTaskInput({ title, dueDate: new Date(`2030-01-0${day}T10:00:00Z`) }),
      );
    }
    await repository.create(buildTaskInput({ title: 'Done', status: 'COMPLETED' }));

    const page = await repository.findMany({
      status: 'PENDING',
      sortBy: 'dueDate',
      order: 'asc',
      page: 1,
      pageSize: 2,
    });

    expect(page.items.map((task) => task.title)).toEqual(['A', 'B']);
    expect(page.total).toBe(3);
  });

  it('sorts statuses in workflow order', async () => {
    for (const status of ['CANCELLED', 'PENDING', 'COMPLETED', 'IN_PROGRESS'] as const) {
      await repository.create(buildTaskInput({ status }));
    }

    const page = await repository.findMany({
      sortBy: 'status',
      order: 'asc',
      page: 1,
      pageSize: 10,
    });

    expect(page.items.map((task) => task.status)).toEqual([
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ]);
  });

  it('counts tasks by status, including statuses with none', async () => {
    await repository.create(buildTaskInput());
    await repository.create(buildTaskInput());
    await repository.create(buildTaskInput({ status: 'COMPLETED' }));

    await expect(repository.countByStatus()).resolves.toEqual({
      PENDING: 2,
      IN_PROGRESS: 0,
      COMPLETED: 1,
      CANCELLED: 0,
    });
  });

  it('updates a task and its status', async () => {
    const created = await repository.create(buildTaskInput());

    const updated = await repository.update(created.id, buildTaskInput({ title: 'Renamed' }));
    const completed = await repository.updateStatus(created.id, 'COMPLETED');

    expect(updated?.title).toBe('Renamed');
    expect(completed).toMatchObject({ title: 'Renamed', status: 'COMPLETED' });
  });

  it('returns null or false when updating or deleting an unknown id', async () => {
    await expect(repository.update('missing', buildTaskInput())).resolves.toBeNull();
    await expect(repository.updateStatus('missing', 'COMPLETED')).resolves.toBeNull();
    await expect(repository.delete('missing')).resolves.toBe(false);
  });

  it('deletes a task', async () => {
    const created = await repository.create(buildTaskInput());

    await expect(repository.delete(created.id)).resolves.toBe(true);
    await expect(repository.findById(created.id)).resolves.toBeNull();
  });

  it('answers a ping', async () => {
    await expect(repository.ping()).resolves.toBeUndefined();
  });
});
