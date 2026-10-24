import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTask, installFakeApi } from '../test/fakeApi';
import { expectNoAccessibilityViolations, renderApp } from '../test/render';

afterEach(() => {
  vi.unstubAllGlobals();
});

const seed = () =>
  installFakeApi([
    buildTask({ id: 'a', title: 'Alpha', status: 'PENDING', dueDate: '2099-01-01T10:00:00.000Z' }),
    buildTask({
      id: 'b',
      title: 'Bravo',
      status: 'IN_PROGRESS',
      description: null,
      dueDate: '2020-01-01T10:00:00.000Z',
    }),
    buildTask({
      id: 'c',
      title: 'Charlie',
      status: 'COMPLETED',
      dueDate: '2020-02-01T10:00:00.000Z',
    }),
  ]);

describe('Task list page', () => {
  it('redirects / to the task list and shows every task', async () => {
    seed();
    renderApp('/');

    expect(await screen.findByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/tasks/a');
    expect(screen.getByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByText('Showing 1 to 3 of 3 tasks')).toBeInTheDocument();
    expect(document.title).toBe('Tasks – Caseworker tasks – HMCTS');
  });

  it('shows status counts in the filter navigation', async () => {
    seed();
    renderApp('/tasks');

    const filters = await screen.findByRole('navigation', { name: 'Filter tasks by status' });
    await waitFor(() =>
      expect(within(filters).getByRole('link', { name: 'All (3)' })).toBeVisible(),
    );
    expect(within(filters).getByRole('link', { name: 'All (3)' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(filters).getByRole('link', { name: 'Pending (1)' })).toHaveAttribute(
      'href',
      '/tasks?status=PENDING',
    );
    expect(within(filters).getByRole('link', { name: 'Cancelled (0)' })).toBeInTheDocument();
  });

  it('flags overdue open tasks but not completed ones', async () => {
    seed();
    renderApp('/tasks');

    const bravoRow = (await screen.findByRole('link', { name: 'Bravo' })).closest('tr')!;
    const charlieRow = screen.getByRole('link', { name: 'Charlie' }).closest('tr')!;

    expect(within(bravoRow).getByText('Overdue')).toBeInTheDocument();
    expect(within(bravoRow).getByText('In progress')).toBeInTheDocument();
    expect(within(charlieRow).queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('filters by status from the URL', async () => {
    const api = seed();
    renderApp('/tasks?status=COMPLETED');

    expect(await screen.findByRole('link', { name: 'Charlie' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Alpha' })).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 1 of 1 completed task')).toBeInTheDocument();
    expect(api.requests[0].url).toContain('status=COMPLETED');
  });

  it('changes the sort order when Apply is pressed', async () => {
    const api = seed();
    const { user } = renderApp('/tasks');
    await screen.findByRole('link', { name: 'Alpha' });

    await user.selectOptions(screen.getByLabelText('Sort by'), 'title-asc');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(api.requests.at(-1)?.url).toBe('/api/tasks?sortBy=title&order=asc&page=1&pageSize=20'),
    );
    const taskTitles = () =>
      screen
        .getAllByRole('link')
        .map((link) => link.textContent)
        .filter((text) => ['Alpha', 'Bravo', 'Charlie'].includes(text ?? ''));
    await waitFor(() => expect(taskTitles()).toEqual(['Alpha', 'Bravo', 'Charlie']));
  });

  it('ignores invalid query parameters', async () => {
    const api = seed();
    renderApp('/tasks?status=NOPE&sort=password&page=-3');

    await screen.findByRole('link', { name: 'Alpha' });
    expect(api.requests[0].url).toBe('/api/tasks?sortBy=dueDate&order=asc&page=1&pageSize=20');
  });

  it('shows pagination when there is more than one page', async () => {
    installFakeApi(
      Array.from({ length: 25 }, (_, i) =>
        buildTask({ title: `Task ${String(i + 1).padStart(2, '0')}` }),
      ),
    );
    renderApp('/tasks?page=2');

    expect(await screen.findByText('Showing 21 to 25 of 25 tasks')).toBeInTheDocument();
    const pagination = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(pagination).getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(pagination).getByRole('link', { name: /Previous/ })).toHaveAttribute(
      'href',
      '/tasks',
    );
    expect(within(pagination).queryByRole('link', { name: /Next/ })).not.toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    installFakeApi([]);
    renderApp('/tasks?status=CANCELLED');

    expect(await screen.findByText('There are no cancelled tasks.')).toBeInTheDocument();
  });

  it('shows the problem page when the API fails', async () => {
    const api = installFakeApi([]);
    api.failWith('GET', /^\/api\/tasks$/, 500);
    renderApp('/tasks');

    expect(
      await screen.findByRole('heading', { name: 'Sorry, there is a problem with the service' }),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    seed();
    const { container } = renderApp('/tasks');
    await screen.findByRole('link', { name: 'Alpha' });

    await expectNoAccessibilityViolations(container);
  });
});
