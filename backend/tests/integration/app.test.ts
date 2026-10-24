import request from 'supertest';
import { TaskRepository } from '../../src/tasks/task.repository';
import { InMemoryTaskRepository } from '../../src/tasks/inMemoryTask.repository';
import { buildTestApp, clock } from '../support/testApp';

/** A repository whose database is unreachable. */
class BrokenRepository extends InMemoryTaskRepository implements TaskRepository {
  constructor() {
    super(clock);
  }
  override async findById(): Promise<never> {
    throw new Error('connection refused: postgres://secret@db');
  }
  override async ping(): Promise<void> {
    throw new Error('connection refused');
  }
}

describe('Application', () => {
  describe('health checks', () => {
    it('GET /health reports the process is up', async () => {
      const { app } = buildTestApp();
      await request(app).get('/health').expect(200, { status: 'UP' });
    });

    it('GET /health/ready reports UP when the database is reachable', async () => {
      const { app } = buildTestApp();
      await request(app)
        .get('/health/ready')
        .expect(200, { status: 'UP', checks: { database: 'UP' } });
    });

    it('GET /health/ready returns 503 when the database is unreachable', async () => {
      const { app } = buildTestApp({ repository: new BrokenRepository() });
      await request(app)
        .get('/health/ready')
        .expect(503, { status: 'DOWN', checks: { database: 'DOWN' } });
    });
  });

  describe('API documentation', () => {
    it('serves the OpenAPI document', async () => {
      const { app } = buildTestApp();
      const response = await request(app).get('/api-docs.json').expect(200);

      expect(response.body.openapi).toBe('3.1.0');
      expect(Object.keys(response.body.paths)).toEqual(
        expect.arrayContaining(['/api/tasks', '/api/tasks/{id}', '/api/tasks/{id}/status']),
      );
    });

    it('serves Swagger UI', async () => {
      const { app } = buildTestApp();
      const response = await request(app).get('/api-docs/').expect(200);

      expect(response.text).toContain('swagger-ui');
    });
  });

  describe('error handling', () => {
    it('returns a JSON 404 for unknown routes', async () => {
      const { app } = buildTestApp();
      await request(app)
        .get('/api/unknown')
        .expect(404, {
          error: { status: 404, code: 'ROUTE_NOT_FOUND', message: 'Cannot GET /api/unknown' },
        });
    });

    it('hides internal details of unexpected errors', async () => {
      const { app } = buildTestApp({ repository: new BrokenRepository() });
      const response = await request(app).get('/api/tasks/any-id').expect(500);

      expect(response.body).toEqual({
        error: {
          status: 500,
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Try again later.',
        },
      });
      expect(JSON.stringify(response.body)).not.toContain('secret');
    });

    it('rate limits the API', async () => {
      const { app } = buildTestApp({ config: { RATE_LIMIT_MAX: 2 } });
      await request(app).get('/api/tasks').expect(200);
      await request(app).get('/api/tasks').expect(200);

      const response = await request(app).get('/api/tasks').expect(429);

      expect(response.body.error.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('request handling', () => {
    it('echoes a supplied X-Request-Id', async () => {
      const { app } = buildTestApp();
      await request(app)
        .get('/health')
        .set('X-Request-Id', 'abc-123')
        .expect('X-Request-Id', 'abc-123');
    });

    it('generates an X-Request-Id when none is supplied', async () => {
      const { app } = buildTestApp();
      const response = await request(app).get('/health');

      expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('sets security headers and hides the framework', async () => {
      const { app } = buildTestApp();
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('allows the configured CORS origin only', async () => {
      const { app } = buildTestApp({ config: { CORS_ORIGIN: ['https://tasks.example'] } });

      const allowed = await request(app).get('/health').set('Origin', 'https://tasks.example');
      const blocked = await request(app).get('/health').set('Origin', 'https://evil.example');

      expect(allowed.headers['access-control-allow-origin']).toBe('https://tasks.example');
      expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
