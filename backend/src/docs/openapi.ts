import {
  DESCRIPTION_MAX_LENGTH,
  MAX_PAGE_SIZE,
  SORT_ORDERS,
  TASK_SORT_FIELDS,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
} from '../tasks/task.types';

const errorResponse = (description: string, example: object) => ({
  description,
  content: {
    'application/json': { schema: { $ref: '#/components/schemas/Error' }, example },
  },
});

const notFound = errorResponse('No task exists with this ID', {
  error: { status: 404, code: 'NOT_FOUND', message: 'Task ckx1 was not found' },
});

const validationFailed = errorResponse('The request failed validation', {
  error: {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'The request contains invalid data',
    details: [{ field: 'title', message: 'Enter a title' }],
  },
});

const taskResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
});

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Task ID',
  schema: { type: 'string', maxLength: 64 },
};

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'HMCTS Caseworker Task API',
    version: '1.0.0',
    description:
      'Create, view, update and delete caseworker tasks. All errors share the `Error` response shape.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Tasks' }, { name: 'Health' }],
  paths: {
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks',
        description:
          'Returns one page of tasks, plus the number of tasks in each status so a client can show filter counts.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Only return tasks with this status',
            schema: { type: 'string', enum: TASK_STATUSES },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: TASK_SORT_FIELDS, default: 'dueDate' },
          },
          {
            name: 'order',
            in: 'query',
            schema: { type: 'string', enum: SORT_ORDERS, default: 'asc' },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'A page of tasks',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskPage' } } },
          },
          400: validationFailed,
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskRequest' },
              example: {
                title: 'Review bundle for hearing',
                description: 'Check the bundle is complete before the hearing on Friday',
                status: 'PENDING',
                dueDate: '2030-01-31T09:30:00Z',
              },
            },
          },
        },
        responses: {
          201: {
            ...taskResponse('The task was created'),
            headers: {
              Location: { description: 'URL of the new task', schema: { type: 'string' } },
            },
          },
          400: validationFailed,
        },
      },
    },
    '/api/tasks/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Tasks'],
        summary: 'Get a task by ID',
        responses: { 200: taskResponse('The task'), 404: notFound },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Replace a task',
        description:
          'Replaces every editable field. Unlike create, the due date may be in the past so overdue tasks can still be edited.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ReplaceTaskRequest' } },
          },
        },
        responses: { 200: taskResponse('The updated task'), 400: validationFailed, 404: notFound },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        responses: { 204: { description: 'The task was deleted' }, 404: notFound },
      },
    },
    '/api/tasks/{id}/status': {
      parameters: [idParameter],
      patch: {
        tags: ['Tasks'],
        summary: 'Update the status of a task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateStatusRequest' },
              example: { status: 'IN_PROGRESS' },
            },
          },
        },
        responses: { 200: taskResponse('The updated task'), 400: validationFailed, 404: notFound },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness check',
        responses: { 200: { description: 'The API process is running' } },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness check',
        responses: {
          200: { description: 'The API can reach the database' },
          503: { description: 'The database cannot be reached' },
        },
      },
    },
  },
  components: {
    schemas: {
      TaskStatus: { type: 'string', enum: TASK_STATUSES },
      Task: {
        type: 'object',
        required: ['id', 'title', 'description', 'status', 'dueDate', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', example: 'cm2r8q1f50000abcd1234efgh' },
          title: { type: 'string', maxLength: TITLE_MAX_LENGTH },
          description: { type: ['string', 'null'], maxLength: DESCRIPTION_MAX_LENGTH },
          status: { $ref: '#/components/schemas/TaskStatus' },
          dueDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTaskRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'dueDate'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: TITLE_MAX_LENGTH },
          description: {
            type: ['string', 'null'],
            maxLength: DESCRIPTION_MAX_LENGTH,
            description: 'Optional. Blank values are stored as null.',
          },
          status: { $ref: '#/components/schemas/TaskStatus', default: 'PENDING' },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 with a time zone offset. Must be in the future.',
          },
        },
      },
      ReplaceTaskRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'status', 'dueDate'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: TITLE_MAX_LENGTH },
          description: { type: ['string', 'null'], maxLength: DESCRIPTION_MAX_LENGTH },
          status: { $ref: '#/components/schemas/TaskStatus' },
          dueDate: { type: 'string', format: 'date-time' },
        },
      },
      UpdateStatusRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['status'],
        properties: { status: { $ref: '#/components/schemas/TaskStatus' } },
      },
      TaskPage: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
          meta: {
            type: 'object',
            required: ['page', 'pageSize', 'total', 'totalPages', 'statusCounts'],
            properties: {
              page: { type: 'integer' },
              pageSize: { type: 'integer' },
              total: { type: 'integer', description: 'Tasks matching the filter' },
              totalPages: { type: 'integer' },
              statusCounts: {
                type: 'object',
                description: 'Number of tasks in each status, ignoring the filter',
                properties: Object.fromEntries(TASK_STATUSES.map((s) => [s, { type: 'integer' }])),
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['status', 'code', 'message'],
            properties: {
              status: { type: 'integer' },
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['field', 'message'],
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
};
