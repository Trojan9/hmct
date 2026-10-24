import { format, isSameDay } from 'date-fns';
import type { Task } from '../api/tasks';
import { isClosed } from './status';

/**
 * Formats dates in the GOV.UK style, for example "31 January 2026 at 9:30am".
 * See https://www.gov.uk/guidance/style-guide/a-to-z#dates and #times.
 */
export const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  const time = date.getMinutes() === 0 ? format(date, 'haaa') : format(date, 'h:mmaaa');
  const readableTime = time === '12am' ? 'midnight' : time === '12pm' ? 'midday' : time;
  return `${format(date, 'd MMMM yyyy')} at ${readableTime}`;
};

export type DueState = 'overdue' | 'due-today' | null;

/** Whether an open task needs attention because of its due date. */
export const dueState = (task: Pick<Task, 'dueDate' | 'status'>, now = new Date()): DueState => {
  if (isClosed(task.status)) return null;
  const due = new Date(task.dueDate);
  if (due.getTime() < now.getTime()) return 'overdue';
  if (isSameDay(due, now)) return 'due-today';
  return null;
};

export interface DateTimeParts {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}

export const toDateTimeParts = (iso: string): DateTimeParts => {
  const date = new Date(iso);
  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
    hour: String(date.getHours()).padStart(2, '0'),
    minute: String(date.getMinutes()).padStart(2, '0'),
  };
};
