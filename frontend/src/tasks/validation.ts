import type { FieldError, TaskInput, TaskStatus } from '../api/tasks';
import type { DateTimeParts } from './dates';

export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 2000;

export interface TaskFormValues extends DateTimeParts {
  title: string;
  description: string;
  status: TaskStatus;
}

/** Form field ids; error summary links point at these. */
export type TaskFormField = 'title' | 'description' | 'status' | 'dueDate' | 'dueTime';

export const FIELD_IDS: Record<TaskFormField, string> = {
  title: 'title',
  description: 'description',
  status: 'status',
  dueDate: 'due-date-day',
  dueTime: 'due-time-hour',
};

export type TaskFormErrors = Partial<Record<TaskFormField, string>>;

const isWholeNumber = (value: string) => /^\d+$/.test(value.trim());

/**
 * Error messages follow the GOV.UK Design System date input guidance:
 * https://design-system.service.gov.uk/components/date-input/#error-messages
 */
const validateDate = ({ day, month, year }: DateTimeParts): string | undefined => {
  const parts = { day, month, year };
  const missing = (Object.keys(parts) as (keyof typeof parts)[]).filter(
    (key) => !parts[key].trim(),
  );
  if (missing.length === 3) return 'Enter the due date';
  if (missing.length > 0) return `Due date must include a ${missing.join(' and ')}`;
  if (![day, month, year].every(isWholeNumber)) return 'Due date must be a real date';
  if (year.trim().length !== 4) return 'Year must include 4 numbers';

  const [d, m, y] = [Number(day), Number(month), Number(year)];
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return 'Due date must be a real date';
  }
  return undefined;
};

const validateTime = ({ hour, minute }: DateTimeParts): string | undefined => {
  if (!hour.trim() && !minute.trim()) return 'Enter the due time';
  if (!hour.trim()) return 'Due time must include an hour';
  if (!minute.trim()) return 'Due time must include a minute';
  if (!isWholeNumber(hour) || !isWholeNumber(minute) || Number(hour) > 23 || Number(minute) > 59) {
    return 'Due time must be a real time, for example 14:30';
  }
  return undefined;
};

/** Builds a local Date from valid parts. Caseworkers enter UK local time. */
export const toDueDate = ({ day, month, year, hour, minute }: DateTimeParts): Date =>
  new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

export const validateTaskForm = (
  values: TaskFormValues,
  options: { requireFutureDueDate: boolean; now?: Date },
): TaskFormErrors => {
  const errors: TaskFormErrors = {};
  const title = values.title.trim();

  if (!title) errors.title = 'Enter a title';
  else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer`;
  }

  if (values.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`;
  }

  const dateError = validateDate(values);
  const timeError = validateTime(values);
  if (dateError) errors.dueDate = dateError;
  if (timeError) errors.dueTime = timeError;

  if (!dateError && !timeError && options.requireFutureDueDate) {
    if (toDueDate(values).getTime() <= (options.now ?? new Date()).getTime()) {
      errors.dueDate = 'Due date must be in the future';
    }
  }

  return errors;
};

export const toTaskInput = (values: TaskFormValues): TaskInput => ({
  title: values.title.trim(),
  description: values.description.trim() || null,
  status: values.status,
  dueDate: toDueDate(values).toISOString(),
});

/** Maps API validation errors onto form fields so they show inline. */
export const fromApiErrors = (details: FieldError[]): TaskFormErrors => {
  const errors: TaskFormErrors = {};
  for (const { field, message } of details) {
    if (field === 'title' || field === 'description' || field === 'status' || field === 'dueDate') {
      errors[field] ??= message;
    }
  }
  return errors;
};
