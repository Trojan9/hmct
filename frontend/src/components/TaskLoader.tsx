import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, type Task } from '../api/tasks';
import { ProblemWithServicePage, TaskNotFoundPage } from '../pages/ErrorPages';
import { useTask } from '../tasks/queries';

/** Loads the task named in the URL and handles the loading, 404 and error states. */
export const TaskLoader = ({ children }: { children: (task: Task) => ReactNode }) => {
  const { id = '' } = useParams();
  const { data: task, isPending, error } = useTask(id);

  if (isPending) {
    return (
      <p className="govuk-body" role="status">
        Loading task…
      </p>
    );
  }
  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <TaskNotFoundPage />
    ) : (
      <ProblemWithServicePage />
    );
  }
  return <>{children(task)}</>;
};
