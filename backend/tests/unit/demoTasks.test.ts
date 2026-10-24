import { demoTasks } from '../../src/tasks/demoTasks';
import { TASK_STATUSES } from '../../src/tasks/task.types';

describe('demoTasks', () => {
  const now = new Date('2026-01-15T12:00:00Z');
  const tasks = demoTasks(now);

  it('covers every status', () => {
    expect(new Set(tasks.map((task) => task.status))).toEqual(new Set(TASK_STATUSES));
  });

  it('includes an overdue open task so the overdue state can be seen', () => {
    expect(
      tasks.some(
        (task) =>
          task.dueDate < now && (task.status === 'PENDING' || task.status === 'IN_PROGRESS'),
      ),
    ).toBe(true);
  });
});
