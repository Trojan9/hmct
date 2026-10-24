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
  error: `Status must be one of ${TASK_STATUSES.join(', ')}`,
});

const titleSchema = z
  .string({
    error: (issue) => (issue.input === undefined ? 'Enter a title' : 'Title must be text'),
  })
  .trim()
  .min(1, 'Enter a title')
  .max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer`);

// Blank descriptions are stored as null so "no description" has one representation.
const descriptionSchema = z
  .string({ error: 'Description must be text' })
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`)
  .nullish()
  .transform((value) => (value ? value : null));

const dueDateSchema = z.iso
  .datetime({
    offset: true,
    error: (issue) =>
      issue.input === undefined
        ? 'Enter a due date'
        : 'Due date must be an ISO 8601 date and time, for example 2030-01-31T09:30:00Z',
  })
  .transform((value) => new Date(value));

/** Rejects fields the API does not accept, naming them in the error. */
const strictObject = <T extends z.ZodRawShape>(shape: T) =>
  z.strictObject(shape, {
    error: (issue) =>
      issue.code === 'unrecognized_keys'
        ? `Unexpected field${issue.keys.length > 1 ? 's' : ''}: ${issue.keys.join(', ')}`
        : undefined,
  });

export const taskIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'Task ID is required').max(64, 'Task ID is too long'),
});

export const createTaskSchema = strictObject({
  title: titleSchema,
  description: descriptionSchema,
  status: statusSchema.default('PENDING'),
  dueDate: dueDateSchema,
});

/** PUT replaces every editable field, so status is required here. */
export const replaceTaskSchema = strictObject({
  title: titleSchema,
  description: descriptionSchema,
  status: statusSchema,
  dueDate: dueDateSchema,
});

export const updateStatusSchema = strictObject({ status: statusSchema });

export const listTasksQuerySchema = z.object({
  status: statusSchema.optional(),
  sortBy: z
    .enum(TASK_SORT_FIELDS, { error: `sortBy must be one of ${TASK_SORT_FIELDS.join(', ')}` })
    .default('dueDate'),
  order: z.enum(SORT_ORDERS, { error: 'order must be asc or desc' }).default('asc'),
  page: z.coerce
    .number({ error: 'page must be a number' })
    .int('page must be a whole number')
    .min(1, 'page must be 1 or more')
    .default(1),
  pageSize: z.coerce
    .number({ error: 'pageSize must be a number' })
    .int('pageSize must be a whole number')
    .min(1, 'pageSize must be 1 or more')
    .max(MAX_PAGE_SIZE, `pageSize must be ${MAX_PAGE_SIZE} or fewer`)
    .default(20),
});
