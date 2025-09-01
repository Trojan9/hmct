import { z } from 'zod';

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  dueDate: z.string().datetime('Invalid date format')
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional()
});

export type CreateTaskRequest = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskSchema>;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}