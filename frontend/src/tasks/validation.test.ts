import { describe, expect, it } from 'vitest';
import { type TaskFormValues, fromApiErrors, toTaskInput, validateTaskForm } from './validation';

const NOW = new Date(2026, 0, 15, 9, 0);

const valid: TaskFormValues = {
  title: 'Review hearing bundle',
  description: '',
  status: 'PENDING',
  day: '20',
  month: '1',
  year: '2026',
  hour: '14',
  minute: '30',
};

const validate = (overrides: Partial<TaskFormValues>, requireFutureDueDate = true) =>
  validateTaskForm({ ...valid, ...overrides }, { requireFutureDueDate, now: NOW });

describe('validateTaskForm', () => {
  it('accepts valid values', () => {
    expect(validate({})).toEqual({});
  });

  it.each([
    [{ title: '   ' }, 'title', 'Enter a title'],
    [{ title: 'x'.repeat(201) }, 'title', 'Title must be 200 characters or fewer'],
    [
      { description: 'x'.repeat(2001) },
      'description',
      'Description must be 2000 characters or fewer',
    ],
    [{ day: '', month: '', year: '' }, 'dueDate', 'Enter the due date'],
    [{ month: '' }, 'dueDate', 'Due date must include a month'],
    [{ day: '', year: '' }, 'dueDate', 'Due date must include a day and year'],
    [{ day: 'ab' }, 'dueDate', 'Due date must be a real date'],
    [{ day: '31', month: '2' }, 'dueDate', 'Due date must be a real date'],
    [{ month: '13' }, 'dueDate', 'Due date must be a real date'],
    [{ year: '26' }, 'dueDate', 'Year must include 4 numbers'],
    [{ hour: '', minute: '' }, 'dueTime', 'Enter the due time'],
    [{ hour: '' }, 'dueTime', 'Due time must include an hour'],
    [{ minute: '' }, 'dueTime', 'Due time must include a minute'],
    [{ hour: '24' }, 'dueTime', 'Due time must be a real time, for example 14:30'],
    [{ minute: '60' }, 'dueTime', 'Due time must be a real time, for example 14:30'],
    [{ day: '14' }, 'dueDate', 'Due date must be in the future'],
    [{ day: '15', hour: '9', minute: '0' }, 'dueDate', 'Due date must be in the future'],
  ])('%j gives "%s: %s"', (overrides, field, message) => {
    expect(validate(overrides)).toEqual({ [field]: message });
  });

  it('allows a past due date when editing', () => {
    expect(validate({ day: '1' }, false)).toEqual({});
  });

  it('accepts a leap day', () => {
    expect(validate({ day: '29', month: '2', year: '2028' })).toEqual({});
  });

  it('reports date and time problems together', () => {
    expect(validate({ title: '', day: '', month: '', year: '', hour: '', minute: '' })).toEqual({
      title: 'Enter a title',
      dueDate: 'Enter the due date',
      dueTime: 'Enter the due time',
    });
  });
});

describe('toTaskInput', () => {
  it('trims text, turns a blank description into null and builds an ISO due date', () => {
    expect(toTaskInput({ ...valid, title: '  A task  ', description: '  ' })).toEqual({
      title: 'A task',
      description: null,
      status: 'PENDING',
      dueDate: new Date(2026, 0, 20, 14, 30).toISOString(),
    });
  });
});

describe('fromApiErrors', () => {
  it('maps known fields and keeps the first message for each', () => {
    expect(
      fromApiErrors([
        { field: 'title', message: 'Enter a title' },
        { field: 'title', message: 'Second title error' },
        { field: 'dueDate', message: 'Due date must be in the future' },
        { field: 'body', message: 'Unrecognized key' },
      ]),
    ).toEqual({ title: 'Enter a title', dueDate: 'Due date must be in the future' });
  });
});
