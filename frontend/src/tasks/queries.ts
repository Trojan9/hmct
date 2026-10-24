import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ListTasksParams, type TaskInput, type TaskStatus, tasksApi } from '../api/tasks';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params: ListTasksParams) => [...taskKeys.all, 'list', params] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export const useTasks = (params: ListTasksParams) =>
  useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(params),
    // Keep showing the current page while the next one loads.
    placeholderData: keepPreviousData,
  });

export const useTask = (id: string) =>
  useQuery({ queryKey: taskKeys.detail(id), queryFn: () => tasksApi.get(id) });

/** Every write invalidates all task queries so lists and counts stay correct. */
const useInvalidateTasks = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taskKeys.all });
};

export const useCreateTask = () => {
  const invalidate = useInvalidateTasks();
  return useMutation({ mutationFn: tasksApi.create, onSuccess: invalidate });
};

export const useReplaceTask = (id: string) => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: TaskInput) => tasksApi.replace(id, input),
    onSuccess: invalidate,
  });
};

export const useUpdateTaskStatus = (id: string) => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (status: TaskStatus) => tasksApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
};

export const useDeleteTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tasksApi.delete(id),
    // Mark everything stale without refetching now: refetching the deleted
    // task would 404 on the page we are about to leave.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all, refetchType: 'none' }),
  });
};
