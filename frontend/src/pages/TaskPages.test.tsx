import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTask, installFakeApi } from '../test/fakeApi';
import { expectNoAccessibilityViolations, renderApp } from '../test/render';

afterEach(() => {
  vi.unstubAllGlobals();
});

const task = buildTask({
  id: 't1',
  title: 'Chase witness statement',
  description: 'Second statement is missing',
  status: 'PENDING',
});

describe('Task detail page', () => {
  it('shows the task with change links', async () => {
    installFakeApi([task]);
    const { container } = renderApp('/tasks/t1');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Chase witness statement' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Second statement is missing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change status' })).toHaveAttribute(
      'href',
      '/tasks/t1/status',
    );
    expect(screen.getByRole('button', { name: 'Delete task' })).toHaveAttribute(
      'href',
      '/tasks/t1/delete',
    );
    expect(document.title).toBe('Chase witness statement – Caseworker tasks – HMCTS');
    await expectNoAccessibilityViolations(container);
  });

  it('says when there is no description', async () => {
    installFakeApi([{ ...task, description: null }]);
    renderApp('/tasks/t1');

    expect(await screen.findByText('No description')).toBeInTheDocument();
  });

  it('shows task not found for an unknown id', async () => {
    installFakeApi();
    renderApp('/tasks/nope');

    expect(await screen.findByRole('heading', { name: 'Task not found' })).toBeInTheDocument();
  });

  it('shows the problem page for a server error', async () => {
    const api = installFakeApi([task]);
    api.failWith('GET', /\/api\/tasks\/t1$/, 503);
    renderApp('/tasks/t1');

    expect(
      await screen.findByRole('heading', { name: 'Sorry, there is a problem with the service' }),
    ).toBeInTheDocument();
  });
});

describe('Change status page', () => {
  it('updates the status and confirms it on the task page', async () => {
    const api = installFakeApi([task]);
    const { user } = renderApp('/tasks/t1/status');

    const pending = await screen.findByRole('radio', { name: 'Pending' });
    expect(pending).toBeChecked();
    expect(pending).toHaveAccessibleDescription('Not started yet');

    await user.click(screen.getByRole('radio', { name: 'Completed' }));
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    expect(await screen.findByText('Status changed to completed')).toBeInTheDocument();
    expect(api.requests.find((r) => r.method === 'PATCH')).toEqual({
      method: 'PATCH',
      url: '/api/tasks/t1/status',
      body: { status: 'COMPLETED' },
    });
    const statusRow = screen.getByText('Status', { selector: 'dt' }).closest('div')!;
    expect(within(statusRow).getByText('Completed')).toBeInTheDocument();
  });

  it('goes back without a request when the status is unchanged', async () => {
    const api = installFakeApi([task]);
    const { user } = renderApp('/tasks/t1/status');

    await user.click(await screen.findByRole('button', { name: 'Save status' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Chase witness statement' }),
    ).toBeInTheDocument();
    expect(api.requests.some((r) => r.method === 'PATCH')).toBe(false);
  });

  it('shows an error summary when saving fails', async () => {
    const api = installFakeApi([task]);
    api.failWith('PATCH', /status$/, 500);
    const { user } = renderApp('/tasks/t1/status');

    await user.click(await screen.findByRole('radio', { name: 'In progress' }));
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    expect(
      await screen.findByRole('link', { name: 'The status could not be changed. Try again.' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('Error: Change status – Caseworker tasks – HMCTS');
  });

  it('has no accessibility violations', async () => {
    installFakeApi([task]);
    const { container } = renderApp('/tasks/t1/status');
    await screen.findByRole('radio', { name: 'Pending' });

    await expectNoAccessibilityViolations(container);
  });
});

describe('Delete task page', () => {
  it('asks for confirmation, deletes and returns to the list', async () => {
    const api = installFakeApi([task]);
    const { user, container } = renderApp('/tasks/t1/delete');

    expect(
      await screen.findByRole('heading', { name: 'Are you sure you want to delete this task?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('You cannot undo this.')).toBeInTheDocument();
    await expectNoAccessibilityViolations(container);

    await user.click(screen.getByRole('button', { name: 'Yes, delete task' }));

    expect(await screen.findByText('Task ‘Chase witness statement’ deleted')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument();
    expect(api.tasks.has('t1')).toBe(false);
  });

  it('links back to the task without deleting', async () => {
    installFakeApi([task]);
    renderApp('/tasks/t1/delete');

    expect(await screen.findByRole('link', { name: 'No, go back' })).toHaveAttribute(
      'href',
      '/tasks/t1',
    );
  });

  it('shows an error when deleting fails', async () => {
    const api = installFakeApi([task]);
    api.failWith('DELETE', /t1$/, 500);
    const { user } = renderApp('/tasks/t1/delete');

    await user.click(await screen.findByRole('button', { name: 'Yes, delete task' }));

    expect(
      await screen.findByText('The task could not be deleted. Try again.'),
    ).toBeInTheDocument();
    expect(api.tasks.has('t1')).toBe(true);
  });
});

describe('Layout', () => {
  it('has a skip link, service navigation and footer', async () => {
    installFakeApi([]);
    renderApp('/tasks');

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    const nav = screen.getByRole('navigation', { name: 'Menu' });
    expect(within(nav).getByRole('link', { name: 'Tasks' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'API documentation' })).toHaveAttribute(
      'href',
      '/api-docs',
    );
  });

  it('moves focus to the main content from the skip link', async () => {
    installFakeApi([]);
    const { user } = renderApp('/tasks');

    await user.click(screen.getByRole('link', { name: 'Skip to main content' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('moves focus to the new heading after navigating', async () => {
    installFakeApi([task]);
    const { user } = renderApp('/tasks');

    await user.click(await screen.findByRole('link', { name: 'Chase witness statement' }));

    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Chase witness statement',
    });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it('shows page not found for unknown URLs', async () => {
    installFakeApi([]);
    renderApp('/somewhere');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(document.title).toBe('Page not found – Caseworker tasks – HMCTS');
  });
});
