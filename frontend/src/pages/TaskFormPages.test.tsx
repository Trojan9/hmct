import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTask, installFakeApi } from '../test/fakeApi';
import { expectNoAccessibilityViolations, renderApp } from '../test/render';

afterEach(() => {
  vi.unstubAllGlobals();
});

const nextYear = String(new Date().getFullYear() + 1);

const fillDueDate = async (user: UserEvent, [day, month, year, hour, minute]: string[]) => {
  const date = screen.getByRole('group', { name: 'Due date' });
  const time = screen.getByRole('group', { name: 'Due time' });
  for (const [label, value] of [
    ['Day', day],
    ['Month', month],
    ['Year', year],
  ]) {
    const input = within(date).getByLabelText(label);
    await user.clear(input);
    if (value) await user.type(input, value);
  }
  for (const [label, value] of [
    ['Hour', hour],
    ['Minute', minute],
  ]) {
    const input = within(time).getByLabelText(label);
    await user.clear(input);
    if (value) await user.type(input, value);
  }
};

describe('Create task page', () => {
  it('shows an error summary and inline errors, and focuses the summary', async () => {
    installFakeApi();
    const { user } = renderApp('/tasks/new');

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    const summary = await screen.findByRole('alert');
    expect(
      within(summary).getByRole('heading', { name: 'There is a problem' }),
    ).toBeInTheDocument();
    expect(
      within(summary)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Enter a title', 'Enter the due date', 'Enter the due time']);
    expect(summary.parentElement).toHaveFocus();
    expect(document.title).toBe('Error: Create a task – Caseworker tasks – HMCTS');
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription(
      'For example, review hearing bundle for case 1742 Error: Enter a title',
    );
  });

  it('keeps focus in a field while the user corrects it', async () => {
    installFakeApi();
    const { user } = renderApp('/tasks/new');
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    await screen.findByRole('alert');

    const title = screen.getByLabelText('Title');
    await user.click(title);
    await user.type(title, 'Fixed');

    expect(title).toHaveFocus();
    expect(title).toHaveValue('Fixed');
  });

  it('moves focus to the field when an error summary link is clicked', async () => {
    installFakeApi();
    const { user } = renderApp('/tasks/new');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await user.click(await screen.findByRole('link', { name: 'Enter the due date' }));

    expect(screen.getByLabelText('Day')).toHaveFocus();
  });

  it('rejects a due date in the past', async () => {
    installFakeApi();
    const { user } = renderApp('/tasks/new');
    await user.type(screen.getByLabelText('Title'), 'Old task');
    await fillDueDate(user, ['1', '1', '2020', '09', '00']);

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(
      await screen.findByRole('link', { name: 'Due date must be in the future' }),
    ).toBeInTheDocument();
  });

  it('creates a task and shows it with a success banner', async () => {
    const api = installFakeApi();
    const { user } = renderApp('/tasks/new');

    await user.type(screen.getByLabelText('Title'), '  Prepare appeal bundle ');
    await user.type(screen.getByLabelText('Description (optional)'), 'Include the decision');
    await user.click(screen.getByLabelText('In progress'));
    await fillDueDate(user, ['3', '11', nextYear, '14', '30']);
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Prepare appeal bundle' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Task created')).toBeInTheDocument();
    expect(api.requests.find((r) => r.method === 'POST')?.body).toEqual({
      title: 'Prepare appeal bundle',
      description: 'Include the decision',
      status: 'IN_PROGRESS',
      dueDate: new Date(Number(nextYear), 10, 3, 14, 30).toISOString(),
    });
  });

  it('shows API validation errors against the right field', async () => {
    const api = installFakeApi();
    api.failWith('POST', /^\/api\/tasks$/, 400, {
      code: 'VALIDATION_ERROR',
      details: [{ field: 'title', message: 'Title is already used' }],
    });
    const { user } = renderApp('/tasks/new');
    await user.type(screen.getByLabelText('Title'), 'Duplicate');
    await fillDueDate(user, ['3', '11', nextYear, '14', '30']);

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByRole('link', { name: 'Title is already used' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription(
      expect.stringContaining('Title is already used'),
    );
  });

  it('shows a general error when the API is unavailable', async () => {
    const api = installFakeApi();
    api.failNetwork('POST', /^\/api\/tasks$/);
    const { user } = renderApp('/tasks/new');
    await user.type(screen.getByLabelText('Title'), 'A task');
    await fillDueDate(user, ['3', '11', nextYear, '14', '30']);

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(
      await screen.findByText('Sorry, the task could not be saved. Try again later.'),
    ).toBeInTheDocument();
  });

  it('counts description characters', async () => {
    installFakeApi();
    const { user } = renderApp('/tasks/new');

    expect(screen.getByText('You have 2,000 characters remaining')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Description (optional)'), 'Hello');

    expect(screen.getByText('You have 1,995 characters remaining')).toBeInTheDocument();
  });

  it('has no accessibility violations, including with errors shown', async () => {
    installFakeApi();
    const { user, container } = renderApp('/tasks/new');
    await expectNoAccessibilityViolations(container);

    await user.click(screen.getByRole('button', { name: 'Create task' }));
    await screen.findByRole('alert');

    await expectNoAccessibilityViolations(container);
  });
});

describe('Edit task page', () => {
  it('pre-fills the form and saves changes, allowing a past due date', async () => {
    const task = buildTask({
      id: 'abc',
      title: 'Original',
      description: null,
      status: 'PENDING',
      dueDate: new Date(2020, 0, 2, 9, 5).toISOString(),
    });
    const api = installFakeApi([task]);
    const { user } = renderApp('/tasks/abc/edit');

    const title = await screen.findByLabelText('Title');
    expect(title).toHaveValue('Original');
    expect(screen.getByLabelText('Day')).toHaveValue('2');
    expect(screen.getByLabelText('Minute')).toHaveValue('05');
    expect(screen.getByLabelText('Pending')).toBeChecked();

    await user.clear(title);
    await user.type(title, 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Renamed' })).toBeInTheDocument();
    expect(screen.getByText('Task updated')).toBeInTheDocument();
    await waitFor(() =>
      expect(api.requests.find((r) => r.method === 'PUT')?.body).toMatchObject({
        title: 'Renamed',
        dueDate: task.dueDate,
      }),
    );
  });

  it('shows task not found for an unknown id', async () => {
    installFakeApi();
    renderApp('/tasks/missing/edit');

    expect(await screen.findByRole('heading', { name: 'Task not found' })).toBeInTheDocument();
  });
});
