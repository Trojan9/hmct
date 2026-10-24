import type { TaskStatus } from '../api/tasks';

interface StatusDisplay {
  label: string;
  /** Hint shown under the radio option when changing status. */
  hint: string;
  /** GOV.UK tag modifier; the default tag colour is blue. */
  tagClass: string;
}

export const STATUS_DISPLAY: Record<TaskStatus, StatusDisplay> = {
  PENDING: { label: 'Pending', hint: 'Not started yet', tagClass: 'govuk-tag--grey' },
  IN_PROGRESS: { label: 'In progress', hint: 'Someone is working on it', tagClass: '' },
  COMPLETED: {
    label: 'Completed',
    hint: 'No further action is needed',
    tagClass: 'govuk-tag--green',
  },
  CANCELLED: {
    label: 'Cancelled',
    hint: 'The task is no longer needed',
    tagClass: 'govuk-tag--purple',
  },
};

/** Statuses where the due date no longer matters. */
export const isClosed = (status: TaskStatus) => status === 'COMPLETED' || status === 'CANCELLED';
