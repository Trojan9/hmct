import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTask, installFakeApi } from '../test/fakeApi';
import { ApiError, tasksApi } from './tasks';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tasksApi', () => {
  it('lists tasks with sort, order, paging and status query parameters', async () => {
    const api = installFakeApi([buildTask({ status: 'COMPLETED' })]);

    const page = await tasksApi.list({ status: 'COMPLETED', sort: 'title-asc', page: 2 });

    expect(api.requests[0].url).toBe(
      '/api/tasks?sortBy=title&order=asc&page=2&pageSize=20&status=COMPLETED',
    );
    expect(page.meta.statusCounts.COMPLETED).toBe(1);
  });

  it('sends JSON for writes and uses the right methods', async () => {
    const task = buildTask();
    const api = installFakeApi([task]);
    const input = {
      title: 'New',
      description: null,
      status: 'PENDING' as const,
      dueDate: task.dueDate,
    };

    await tasksApi.create(input);
    await tasksApi.replace(task.id, input);
    await tasksApi.updateStatus(task.id, 'COMPLETED');
    await tasksApi.delete(task.id);

    expect(api.requests.map((r) => `${r.method} ${r.url}`)).toEqual([
      'POST /api/tasks',
      `PUT /api/tasks/${task.id}`,
      `PATCH /api/tasks/${task.id}/status`,
      `DELETE /api/tasks/${task.id}`,
    ]);
    expect(api.requests[2].body).toEqual({ status: 'COMPLETED' });
  });

  it('encodes ids in the URL', async () => {
    const api = installFakeApi();
    await expect(tasksApi.get('a/b')).rejects.toBeInstanceOf(ApiError);
    expect(api.requests[0].url).toBe('/api/tasks/a%2Fb');
  });

  it('turns an error response into an ApiError with its details', async () => {
    const api = installFakeApi();
    api.failWith('POST', /\/api\/tasks$/, 400, {
      code: 'VALIDATION_ERROR',
      message: 'The request contains invalid data',
      details: [{ field: 'title', message: 'Enter a title' }],
    });

    const error = await tasksApi
      .create({ title: '', description: null, status: 'PENDING', dueDate: '' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ field: 'title', message: 'Enter a title' }],
    });
  });

  it('handles an error response without a JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Bad gateway', { status: 502 })),
    );

    await expect(tasksApi.get('x')).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN_ERROR',
      message: 'Request failed with status 502',
    });
  });

  it('reports a network failure', async () => {
    const api = installFakeApi();
    api.failNetwork('GET', /\/api\/tasks/);

    await expect(tasksApi.get('x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
