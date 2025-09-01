import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Task API', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'PENDING',
        dueDate: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        dueDate: 'invalid-date'
      };

      await request(app)
        .post('/api/tasks')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});