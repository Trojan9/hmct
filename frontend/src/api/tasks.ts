export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const SORT_OPTIONS = {
  'dueDate-asc': 'Due date (soonest first)',
  'dueDate-desc': 'Due date (latest first)',
  'createdAt-desc': 'Recently created',
  'title-asc': 'Title (A to Z)',
} as const;
export type SortOption = keyof typeof SORT_OPTIONS;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPage {
  data: Task[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    statusCounts: Record<TaskStatus, number>;
  };
}

export interface TaskInput {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string;
}

export interface ListTasksParams {
  status?: TaskStatus;
  sort: SortOption;
  page: number;
  pageSize?: number;
}

export interface FieldError {
  field: string;
  message: string;
}

/** An error response from the API, in the shape documented at /api-docs. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[];

  constructor(status: number, code: string, message: string, details: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not connect to the task service');
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: Partial<ApiError> } | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `Request failed with status ${response.status}`,
      error?.details ?? [],
    );
  }
  return body as T;
};

const taskPath = (id: string) => `/api/tasks/${encodeURIComponent(id)}`;

export const tasksApi = {
  list: ({ status, sort, page, pageSize = 20 }: ListTasksParams) => {
    const [sortBy, order] = sort.split('-');
    const query = new URLSearchParams({
      sortBy,
      order,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) query.set('status', status);
    return request<TaskPage>(`/api/tasks?${query.toString()}`);
  },

  get: (id: string) => request<Task>(taskPath(id)),

  create: (input: TaskInput) =>
    request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),

  replace: (id: string, input: TaskInput) =>
    request<Task>(taskPath(id), { method: 'PUT', body: JSON.stringify(input) }),

  updateStatus: (id: string, status: TaskStatus) =>
    request<Task>(`${taskPath(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  delete: (id: string) => request<void>(taskPath(id), { method: 'DELETE' }),
};
