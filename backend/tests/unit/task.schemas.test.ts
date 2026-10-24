import { ValidationError } from '../../src/errors/AppError';
import { parseOrThrow } from '../../src/lib/validation';
import {
  createTaskSchema,
  listTasksQuerySchema,
  replaceTaskSchema,
  taskIdParamsSchema,
  updateStatusSchema,
} from '../../src/tasks/task.schemas';

const validCreate = { title: 'Review bundle', dueDate: '2030-01-31T09:30:00Z' };

const fieldErrors = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    if (error instanceof ValidationError) return error.details ?? [];
    throw error;
  }
  throw new Error('Expected a ValidationError');
};

describe('createTaskSchema', () => {
  it('applies defaults and normalises values', () => {
    expect(
      parseOrThrow(createTaskSchema, {
        ...validCreate,
        title: '  Review bundle  ',
        description: '   ',
      }),
    ).toEqual({
      title: 'Review bundle',
      description: null,
      status: 'PENDING',
      dueDate: new Date('2030-01-31T09:30:00Z'),
    });
  });

  it('accepts a time zone offset', () => {
    const { dueDate } = parseOrThrow(createTaskSchema, {
      ...validCreate,
      dueDate: '2030-06-01T10:00:00+01:00',
    });
    expect(dueDate.toISOString()).toBe('2030-06-01T09:00:00.000Z');
  });

  it.each([
    [{ dueDate: validCreate.dueDate }, 'title', 'Enter a title'],
    [{ ...validCreate, title: '   ' }, 'title', 'Enter a title'],
    [{ ...validCreate, title: 42 }, 'title', 'Title must be text'],
    [{ ...validCreate, title: 'x'.repeat(201) }, 'title', 'Title must be 200 characters or fewer'],
    [
      { ...validCreate, description: 'x'.repeat(2001) },
      'description',
      'Description must be 2000 characters or fewer',
    ],
    [{ title: 'A task' }, 'dueDate', 'Enter a due date'],
    [
      { ...validCreate, dueDate: '31/01/2030' },
      'dueDate',
      'Due date must be an ISO 8601 date and time, for example 2030-01-31T09:30:00Z',
    ],
    [
      { ...validCreate, status: 'DONE' },
      'status',
      'Status must be one of PENDING, IN_PROGRESS, COMPLETED, CANCELLED',
    ],
  ])('rejects %j with an error on %s', (input, field, message) => {
    expect(fieldErrors(() => parseOrThrow(createTaskSchema, input))).toContainEqual({
      field,
      message,
    });
  });

  it('rejects unknown fields', () => {
    expect(
      fieldErrors(() => parseOrThrow(createTaskSchema, { ...validCreate, id: 'abc' })),
    ).toEqual([{ field: 'body', message: 'Unexpected field: id' }]);
  });

  it('reports every problem at once', () => {
    expect(fieldErrors(() => parseOrThrow(createTaskSchema, {}))).toHaveLength(2);
  });
});

describe('replaceTaskSchema', () => {
  it('requires a status', () => {
    expect(fieldErrors(() => parseOrThrow(replaceTaskSchema, validCreate))).toEqual([
      {
        field: 'status',
        message: 'Status must be one of PENDING, IN_PROGRESS, COMPLETED, CANCELLED',
      },
    ]);
  });

  it('accepts a full task', () => {
    expect(
      parseOrThrow(replaceTaskSchema, { ...validCreate, status: 'COMPLETED', description: 'Done' }),
    ).toMatchObject({ status: 'COMPLETED', description: 'Done' });
  });
});

describe('updateStatusSchema', () => {
  it('accepts a known status', () => {
    expect(parseOrThrow(updateStatusSchema, { status: 'IN_PROGRESS' })).toEqual({
      status: 'IN_PROGRESS',
    });
  });

  it('rejects a missing status', () => {
    expect(fieldErrors(() => parseOrThrow(updateStatusSchema, {}))[0].field).toBe('status');
  });
});

describe('taskIdParamsSchema', () => {
  it('rejects an id longer than 64 characters', () => {
    expect(fieldErrors(() => parseOrThrow(taskIdParamsSchema, { id: 'x'.repeat(65) }))).toEqual([
      { field: 'id', message: 'Task ID is too long' },
    ]);
  });
});

describe('listTasksQuerySchema', () => {
  it('applies defaults', () => {
    expect(parseOrThrow(listTasksQuerySchema, {})).toEqual({
      sortBy: 'dueDate',
      order: 'asc',
      page: 1,
      pageSize: 20,
    });
  });

  it('coerces numeric query strings', () => {
    expect(
      parseOrThrow(listTasksQuerySchema, {
        status: 'COMPLETED',
        sortBy: 'title',
        order: 'desc',
        page: '3',
        pageSize: '50',
      }),
    ).toEqual({ status: 'COMPLETED', sortBy: 'title', order: 'desc', page: 3, pageSize: 50 });
  });

  it.each([
    [{ sortBy: 'password' }, 'sortBy'],
    [{ order: 'sideways' }, 'order'],
    [{ page: '0' }, 'page'],
    [{ page: 'abc' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ pageSize: '101' }, 'pageSize'],
    [{ status: 'DONE' }, 'status'],
  ])('rejects %j', (query, field) => {
    expect(fieldErrors(() => parseOrThrow(listTasksQuerySchema, query))[0].field).toBe(field);
  });
});
