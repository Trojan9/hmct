import { describe, expect, it } from 'vitest';
import { dueState, formatDateTime, toDateTimeParts } from './dates';

const local = (...args: [number, number, number, number, number]) =>
  new Date(...args).toISOString();

describe('formatDateTime', () => {
  it.each([
    [local(2026, 0, 31, 9, 30), '31 January 2026 at 9:30am'],
    [local(2026, 0, 31, 14, 0), '31 January 2026 at 2pm'],
    [local(2026, 0, 31, 12, 0), '31 January 2026 at midday'],
    [local(2026, 0, 31, 0, 0), '31 January 2026 at midnight'],
    [local(2026, 5, 1, 16, 5), '1 June 2026 at 4:05pm'],
  ])('formats %s as "%s"', (iso, expected) => {
    expect(formatDateTime(iso)).toBe(expected);
  });
});

describe('dueState', () => {
  const now = new Date(2026, 0, 15, 12, 0);

  it('is overdue when an open task is past its due date', () => {
    expect(dueState({ status: 'IN_PROGRESS', dueDate: local(2026, 0, 15, 11, 0) }, now)).toBe(
      'overdue',
    );
  });

  it('is due today when an open task is due later today', () => {
    expect(dueState({ status: 'PENDING', dueDate: local(2026, 0, 15, 17, 0) }, now)).toBe(
      'due-today',
    );
  });

  it('is nothing when the task is due on a later day', () => {
    expect(dueState({ status: 'PENDING', dueDate: local(2026, 0, 16, 9, 0) }, now)).toBeNull();
  });

  it.each(['COMPLETED', 'CANCELLED'] as const)('ignores due dates for %s tasks', (status) => {
    expect(dueState({ status, dueDate: local(2020, 0, 1, 9, 0) }, now)).toBeNull();
  });
});

describe('toDateTimeParts', () => {
  it('splits a date into form fields in local time', () => {
    expect(toDateTimeParts(local(2026, 2, 7, 8, 5))).toEqual({
      day: '7',
      month: '3',
      year: '2026',
      hour: '08',
      minute: '05',
    });
  });
});
