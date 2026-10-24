import { TaskInput } from './task.types';

const daysFromNow = (now: Date, days: number, hour = 10) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

/** Realistic example tasks, with due dates relative to today, for demos and local development. */
export const demoTasks = (now = new Date()): TaskInput[] => [
  {
    title: 'Review hearing bundle for case 1742',
    description: 'Check all evidence is indexed and paginated before the hearing.',
    status: 'IN_PROGRESS',
    dueDate: daysFromNow(now, 1),
  },
  {
    title: 'Send notice of hearing to respondent',
    description: null,
    status: 'PENDING',
    dueDate: daysFromNow(now, 3, 9),
  },
  {
    title: 'Chase missing witness statement',
    description: 'Applicant’s solicitor has not filed the second witness statement.',
    status: 'PENDING',
    dueDate: daysFromNow(now, -2, 16),
  },
  {
    title: 'List directions hearing',
    description: null,
    status: 'COMPLETED',
    dueDate: daysFromNow(now, -5, 11),
  },
  {
    title: 'Update case record with new address',
    description: null,
    status: 'CANCELLED',
    dueDate: daysFromNow(now, 7, 14),
  },
];
