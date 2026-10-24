import { Router } from 'express';
import { createTaskController } from './task.controller';
import { TaskService } from './task.service';

// Endpoint documentation lives in src/docs/openapi.ts and is served at /api-docs.
export const createTaskRouter = (service: TaskService): Router => {
  const controller = createTaskController(service);
  const router = Router();

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.put('/:id', controller.replace);
  router.patch('/:id/status', controller.updateStatus);
  router.delete('/:id', controller.delete);

  return router;
};
