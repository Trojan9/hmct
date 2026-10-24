export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_SORT_FIELDS = ['dueDate', 'createdAt', 'title', 'status'] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 2000;
export const MAX_PAGE_SIZE = 100;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** The fields a caseworker can set on a task. */
export interface TaskInput {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date;
}

export interface ListTasksQuery {
  status?: TaskStatus;
  sortBy: TaskSortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}

export type StatusCounts = Record<TaskStatus, number>;

export interface TaskPage {
  data: Task[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    statusCounts: StatusCounts;
  };
}
