import { z } from 'zod';
import {
  DESCRIPTION_MAX_LENGTH,
  MAX_PAGE_SIZE,
  SORT_ORDERS,
  TASK_SORT_FIELDS,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
} from './task.types';

const statusSchema = z.enum(TASK_STATUSES, {
  errorMap: () => ({ message: `Status must be one of ${TASK_STATUSES.join(', ')}` }),
});

const titleSchema = z
  .string({
    required_error: 'Enter a title',
    invalid_type_error: 'Title must be text',
  })
  .trim()
  .min(1, 'Enter a title')
  .max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer`);

// Blank descriptions are stored as null so "no description" has one representation.
const descriptionSchema = z
  .string({ invalid_type_error: 'Description must be text' })
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`)
  .nullish()
  .transform((value) => (value ? value : null));

const dueDateSchema = z
  .string({ required_error: 'Enter a due date' })
  .datetime({
    offset: true,
    message: 'Due date must be an ISO 8601 date and time, for example 2030-01-31T09:30:00Z',
  })
  .transform((value) => new Date(value));

export const taskIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'Task ID is required').max(64, 'Task ID is too long'),
});

export const createTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    status: statusSchema.default('PENDING'),
    dueDate: dueDateSchema,
  })
  .strict();

/** PUT replaces every editable field, so status is required here. */
export const replaceTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    status: statusSchema,
    dueDate: dueDateSchema,
  })
  .strict();

export const updateStatusSchema = z.object({ status: statusSchema }).strict();

export const listTasksQuerySchema = z.object({
  status: statusSchema.optional(),
  sortBy: z
    .enum(TASK_SORT_FIELDS, {
      errorMap: () => ({ message: `sortBy must be one of ${TASK_SORT_FIELDS.join(', ')}` }),
    })
    .default('dueDate'),
  order: z
    .enum(SORT_ORDERS, { errorMap: () => ({ message: 'order must be asc or desc' }) })
    .default('asc'),
  page: z.coerce
    .number({ invalid_type_error: 'page must be a number' })
    .int('page must be a whole number')
    .min(1, 'page must be 1 or more')
    .default(1),
  pageSize: z.coerce
    .number({ invalid_type_error: 'pageSize must be a number' })
    .int('pageSize must be a whole number')
    .min(1, 'pageSize must be 1 or more')
    .max(MAX_PAGE_SIZE, `pageSize must be ${MAX_PAGE_SIZE} or fewer`)
    .default(20),
});
