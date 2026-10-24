import { vi } from 'vitest';
import { TASK_STATUSES, type Task, type TaskStatus } from '../api/tasks';

let nextId = 1;

export const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${nextId++}`,
  title: 'Review hearing bundle',
  description: 'Check every page is indexed',
  status: 'PENDING',
  dueDate: '2099-03-01T10:00:00.000Z',
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-01-01T09:00:00.000Z',
  ...overrides,
});

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const notFound = (id: string) =>
  json(404, { error: { status: 404, code: 'NOT_FOUND', message: `Task ${id} was not found` } });

interface Failure {
  method: string;
  path: RegExp;
  response: () => Response;
}

/**
 * A stateful fake of the task API installed as global fetch, so page tests
 * exercise real requests and responses without a server.
 */
export const installFakeApi = (initialTasks: Task[] = []) => {
  const tasks = new Map(initialTasks.map((task) => [task.id, { ...task }]));
  const failures: Failure[] = [];
  const requests: { method: string; url: string; body?: unknown }[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init.method ?? 'GET').toUpperCase();
    const body: unknown = init.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ method, url: `${url.pathname}${url.search}`, body });

    const failure = failures.find((f) => f.method === method && f.path.test(url.pathname));
    if (failure) return failure.response();

    const [, , , id, action] = url.pathname.split('/');

    if (method === 'GET' && !id) {
      const status = url.searchParams.get('status') as TaskStatus | null;
      const sortBy = (url.searchParams.get('sortBy') ?? 'dueDate') as keyof Task;
      const order = url.searchParams.get('order') === 'desc' ? -1 : 1;
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const all = [...tasks.values()];
      const matching = all
        .filter((task) => !status || task.status === status)
        .sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])) * order);
      return json(200, {
        data: matching.slice((page - 1) * pageSize, page * pageSize),
        meta: {
          page,
          pageSize,
          total: matching.length,
          totalPages: Math.max(1, Math.ceil(matching.length / pageSize)),
          statusCounts: Object.fromEntries(
            TASK_STATUSES.map((s) => [s, all.filter((task) => task.status === s).length]),
          ),
        },
      });
    }

    if (method === 'POST' && !id) {
      const task = buildTask({ ...(body as Partial<Task>) });
      tasks.set(task.id, task);
      return json(201, task);
    }

    const existing = tasks.get(id);
    if (!existing) return notFound(id);

    if (method === 'GET') return json(200, existing);
    if (method === 'DELETE') {
      tasks.delete(id);
      return json(204);
    }
    if (method === 'PUT' || (method === 'PATCH' && action === 'status')) {
      const updated = { ...existing, ...(body as Partial<Task>) };
      tasks.set(id, updated);
      return json(200, updated);
    }
    return json(404, { error: { status: 404, code: 'ROUTE_NOT_FOUND', message: 'Not found' } });
  });

  vi.stubGlobal('fetch', fetchMock);

  return {
    tasks,
    requests,
    /** Make the next matching request(s) return this response instead. */
    failWith: (method: string, path: RegExp, status: number, error: object = {}) => {
      failures.push({
        method,
        path,
        response: () =>
          json(status, { error: { status, code: 'ERROR', message: 'Failed', ...error } }),
      });
    },
    failNetwork: (method: string, path: RegExp) => {
      failures.push({
        method,
        path,
        response: () => {
          throw new TypeError('Failed to fetch');
        },
      });
    },
  };
};
