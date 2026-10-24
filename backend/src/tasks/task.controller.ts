import { Request, Response } from 'express';
import { parseOrThrow } from '../lib/validation';
import {
  createTaskSchema,
  listTasksQuerySchema,
  replaceTaskSchema,
  taskIdParamsSchema,
  updateStatusSchema,
} from './task.schemas';
import { TaskService } from './task.service';

/**
 * HTTP adapter for the task service: validates input, calls the service and
 * picks the status code. Errors are thrown and rendered by the error handler.
 */
export const createTaskController = (service: TaskService) => ({
  list: async (req: Request, res: Response) => {
    const query = parseOrThrow(listTasksQuerySchema, req.query);
    res.json(await service.list(query));
  },

  get: async (req: Request, res: Response) => {
    const { id } = parseOrThrow(taskIdParamsSchema, req.params);
    res.json(await service.get(id));
  },

  create: async (req: Request, res: Response) => {
    const input = parseOrThrow(createTaskSchema, req.body);
    const task = await service.create(input);
    res.status(201).location(`${req.baseUrl}/${task.id}`).json(task);
  },

  replace: async (req: Request, res: Response) => {
    const { id } = parseOrThrow(taskIdParamsSchema, req.params);
    const input = parseOrThrow(replaceTaskSchema, req.body);
    res.json(await service.replace(id, input));
  },

  updateStatus: async (req: Request, res: Response) => {
    const { id } = parseOrThrow(taskIdParamsSchema, req.params);
    const { status } = parseOrThrow(updateStatusSchema, req.body);
    res.json(await service.updateStatus(id, status));
  },

  delete: async (req: Request, res: Response) => {
    const { id } = parseOrThrow(taskIdParamsSchema, req.params);
    await service.delete(id);
    res.status(204).send();
  },
});
