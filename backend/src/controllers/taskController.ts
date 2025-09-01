import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateTaskSchema, UpdateTaskSchema } from '../types/task';
import { logger } from '../utils/logger';
import { z } from 'zod';

const prisma = new PrismaClient();

const taskController = {

  createTask: async (req: Request, res: Response): Promise<any> => {
    try {
      const validatedData = CreateTaskSchema.parse(req.body);
      
      const task = await prisma.task.create({
        data: {
          ...validatedData,
          dueDate: new Date(validatedData.dueDate)
        }
      });

      logger.info(`Task created: ${task.id}`);
      return res.status(201).json(task);
    } catch (error: any) {
      logger.error('Error creating task:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      return res.status(500).json({ error: 'Failed to create task' });
    }
  },

  getAllTasks: async (req: Request, res: Response): Promise<any> => {
    try {
      const { status, sortBy = 'dueDate', order = 'asc' } = req.query;
      
      // Validate status if provided
      const whereClause: any = {};
      if (status && typeof status === 'string') {
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (validStatuses.includes(status)) {
          whereClause.status = status;
        }
      }

      const orderByClause = { [sortBy as string]: order };

      const tasks = await prisma.task.findMany({
        where: whereClause,
        orderBy: orderByClause
      });

      return res.json(tasks);
    } catch (error: any) {
      logger.error('Error fetching tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  },

  getTaskById: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      
      const task = await prisma.task.findUnique({
        where: { id }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      return res.json(task);
    } catch (error: any) {
      logger.error('Error fetching task:', error);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
  },

  updateTask: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const validatedData = UpdateTaskSchema.parse(req.body);

      const updateData = {
        ...validatedData,
        ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) })
      };

      const task = await prisma.task.update({
        where: { id },
        data: updateData
      });

      logger.info(`Task updated: ${task.id}`);
      return res.json(task);
    } catch (error: any) {
      logger.error('Error updating task:', error);
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Task not found' });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      return res.status(500).json({ error: 'Failed to update task' });
    }
  },

  deleteTask: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      await prisma.task.delete({
        where: { id }
      });

      logger.info(`Task deleted: ${id}`);
      return res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting task:', error);
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.status(500).json({ error: 'Failed to delete task' });
    }
  }
};

export default taskController;