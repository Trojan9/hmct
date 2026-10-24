import type { Task, TaskStatus } from '../api/tasks';
import { dueState } from '../tasks/dates';
import { STATUS_DISPLAY } from '../tasks/status';

export const StatusTag = ({ status }: { status: TaskStatus }) => {
  const { label, tagClass } = STATUS_DISPLAY[status];
  return <strong className={`govuk-tag ${tagClass}`.trim()}>{label}</strong>;
};

/** "Overdue" or "Due today" for open tasks; nothing otherwise. */
export const DueTag = ({ task, now }: { task: Pick<Task, 'dueDate' | 'status'>; now?: Date }) => {
  const state = dueState(task, now);
  if (state === 'overdue') return <strong className="govuk-tag govuk-tag--red">Overdue</strong>;
  if (state === 'due-today')
    return <strong className="govuk-tag govuk-tag--orange">Due today</strong>;
  return null;
};
