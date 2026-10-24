import request from 'supertest';
import { Express } from 'express';
import { TaskRepository } from '../../src/tasks/task.repository';
import { FUTURE, NOW, PAST, buildTaskInput, buildTestApp } from '../support/testApp';

const newTask = {
  title: 'Review hearing bundle',
  description: 'Check every page is indexed',
  status: 'PENDING',
  dueDate: FUTURE,
};

describe('Tasks API', () => {
  let app: Express;
  let repository: TaskRepository;

  beforeEach(() => {
    ({ app, repository } = buildTestApp());
  });

  describe('POST /api/tasks', () => {
    it('creates a task and returns 201 with a Location header', async () => {
      const response = await request(app).post('/api/tasks').send(newTask).expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        ...newTask,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      });
      expect(response.headers.location).toBe(`/api/tasks/${response.body.id}`);
      expect(await repository.findById(response.body.id)).not.toBeNull();
    });

    it('defaults the status to PENDING and the description to null', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Minimal task', dueDate: FUTURE })
        .expect(201);

      expect(response.body).toMatchObject({ status: 'PENDING', description: null });
    });

    it('returns 400 with field errors for invalid input', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '', dueDate: 'tomorrow' })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'The request contains invalid data',
          details: [
            { field: 'title', message: 'Enter a title' },
            {
              field: 'dueDate',
              message:
                'Due date must be an ISO 8601 date and time, for example 2030-01-31T09:30:00Z',
            },
          ],
        },
      });
    });

    it('returns 400 when the due date is in the past', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ ...newTask, dueDate: PAST })
        .expect(400);

      expect(response.body.error.details).toEqual([
        { field: 'dueDate', message: 'Due date must be in the future' },
      ]);
    });

    it('returns 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title": ')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    it('returns 413 for a body over 100kb', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ ...newTask, description: 'x'.repeat(110 * 1024) })
        .expect(413);

      expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns the task', async () => {
      const task = await repository.create(buildTaskInput());

      const response = await request(app).get(`/api/tasks/${task.id}`).expect(200);

      expect(response.body).toMatchObject({ id: task.id, title: task.title, dueDate: FUTURE });
    });

    it('returns 404 for an unknown id', async () => {
      const response = await request(app).get('/api/tasks/does-not-exist').expect(404);

      expect(response.body).toEqual({
        error: { status: 404, code: 'NOT_FOUND', message: 'Task does-not-exist was not found' },
      });
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await repository.create(
        buildTaskInput({ title: 'Bravo', dueDate: new Date('2026-03-01T10:00:00Z') }),
      );
      await repository.create(
        buildTaskInput({
          title: 'Alpha',
          status: 'COMPLETED',
          dueDate: new Date('2026-02-01T10:00:00Z'),
        }),
      );
      await repository.create(
        buildTaskInput({
          title: 'Charlie',
          status: 'IN_PROGRESS',
          dueDate: new Date('2026-04-01T10:00:00Z'),
        }),
      );
    });

    it('returns tasks sorted by due date with paging metadata', async () => {
      const response = await request(app).get('/api/tasks').expect(200);

      expect(response.body.data.map((t: { title: string }) => t.title)).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
      ]);
      expect(response.body.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 3,
        totalPages: 1,
        statusCounts: { PENDING: 1, IN_PROGRESS: 1, COMPLETED: 1, CANCELLED: 0 },
      });
    });

    it('filters by status', async () => {
      const response = await request(app).get('/api/tasks?status=IN_PROGRESS').expect(200);

      expect(response.body.data.map((t: { title: string }) => t.title)).toEqual(['Charlie']);
      expect(response.body.meta.total).toBe(1);
    });

    it('sorts by another field in descending order', async () => {
      const response = await request(app).get('/api/tasks?sortBy=title&order=desc').expect(200);

      expect(response.body.data.map((t: { title: string }) => t.title)).toEqual([
        'Charlie',
        'Bravo',
        'Alpha',
      ]);
    });

    it('pages results', async () => {
      const response = await request(app).get('/api/tasks?page=2&pageSize=2').expect(200);

      expect(response.body.data.map((t: { title: string }) => t.title)).toEqual(['Charlie']);
      expect(response.body.meta).toMatchObject({ page: 2, pageSize: 2, totalPages: 2 });
    });

    it('returns 400 for an unsupported sort field', async () => {
      const response = await request(app).get('/api/tasks?sortBy=password').expect(400);

      expect(response.body.error.details[0].field).toBe('sortBy');
    });

    it('returns 400 for an unknown status filter', async () => {
      await request(app).get('/api/tasks?status=DONE').expect(400);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('replaces the task, allowing a past due date', async () => {
      const task = await repository.create(buildTaskInput());

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ title: 'Updated', description: null, status: 'IN_PROGRESS', dueDate: PAST })
        .expect(200);

      expect(response.body).toMatchObject({
        id: task.id,
        title: 'Updated',
        description: null,
        status: 'IN_PROGRESS',
        dueDate: PAST,
      });
    });

    it('returns 400 when a required field is missing', async () => {
      const task = await repository.create(buildTaskInput());

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ title: 'Updated', dueDate: FUTURE })
        .expect(400);

      expect(response.body.error.details[0].field).toBe('status');
    });

    it('returns 404 for an unknown id', async () => {
      await request(app)
        .put('/api/tasks/does-not-exist')
        .send({ ...newTask, status: 'COMPLETED' })
        .expect(404);
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('updates only the status', async () => {
      const task = await repository.create(buildTaskInput());

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: task.id,
        title: task.title,
        description: task.description,
        status: 'COMPLETED',
      });
    });

    it('returns 400 for an invalid status', async () => {
      const task = await repository.create(buildTaskInput());

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .send({ status: 'FINISHED' })
        .expect(400);

      expect(response.body.error.details).toEqual([
        {
          field: 'status',
          message: 'Status must be one of PENDING, IN_PROGRESS, COMPLETED, CANCELLED',
        },
      ]);
    });

    it('returns 400 when other fields are sent', async () => {
      const task = await repository.create(buildTaskInput());

      await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .send({ status: 'COMPLETED', title: 'Sneaky edit' })
        .expect(400);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app)
        .patch('/api/tasks/does-not-exist/status')
        .send({ status: 'COMPLETED' })
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes the task and returns 204', async () => {
      const task = await repository.create(buildTaskInput());

      await request(app).delete(`/api/tasks/${task.id}`).expect(204);

      expect(await repository.findById(task.id)).toBeNull();
    });

    it('returns 404 for an unknown id', async () => {
      await request(app).delete('/api/tasks/does-not-exist').expect(404);
    });
  });
});
