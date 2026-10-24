import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Task } from '../api/tasks';
import { TaskForm } from '../components/TaskForm';
import { TaskLoader } from '../components/TaskLoader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNavigateWithFlash } from '../hooks/useFlash';
import { toDateTimeParts } from '../tasks/dates';
import { useCreateTask, useReplaceTask } from '../tasks/queries';
import type { TaskFormValues } from '../tasks/validation';

const EMPTY_FORM: TaskFormValues = {
  title: '',
  description: '',
  status: 'PENDING',
  day: '',
  month: '',
  year: '',
  hour: '',
  minute: '',
};

export const CreateTaskPage = () => {
  const [hasErrors, setHasErrors] = useState(false);
  const mutation = useCreateTask();
  const navigateWithFlash = useNavigateWithFlash();
  useDocumentTitle('Create a task', hasErrors);

  return (
    <>
      <Link to="/tasks" className="govuk-back-link">
        Back to tasks
      </Link>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <h1 className="govuk-heading-l">Create a task</h1>
          <TaskForm
            initialValues={EMPTY_FORM}
            requireFutureDueDate
            submitLabel="Create task"
            cancelHref="/tasks"
            isSubmitting={mutation.isPending}
            onErrorsChange={setHasErrors}
            onSubmit={async (input) => {
              const task = await mutation.mutateAsync(input);
              navigateWithFlash(`/tasks/${task.id}`, 'Task created');
            }}
          />
        </div>
      </div>
    </>
  );
};

const EditTask = ({ task }: { task: Task }) => {
  const [hasErrors, setHasErrors] = useState(false);
  const mutation = useReplaceTask(task.id);
  const navigateWithFlash = useNavigateWithFlash();
  const taskUrl = `/tasks/${task.id}`;
  useDocumentTitle('Edit task', hasErrors);

  return (
    <>
      <Link to={taskUrl} className="govuk-back-link">
        Back
      </Link>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <span className="govuk-caption-l">{task.title}</span>
          <h1 className="govuk-heading-l">Edit task</h1>
          <TaskForm
            initialValues={{
              title: task.title,
              description: task.description ?? '',
              status: task.status,
              ...toDateTimeParts(task.dueDate),
            }}
            requireFutureDueDate={false}
            submitLabel="Save changes"
            cancelHref={taskUrl}
            isSubmitting={mutation.isPending}
            onErrorsChange={setHasErrors}
            onSubmit={async (input) => {
              await mutation.mutateAsync(input);
              navigateWithFlash(taskUrl, 'Task updated');
            }}
          />
        </div>
      </div>
    </>
  );
};

export const EditTaskPage = () => <TaskLoader>{(task) => <EditTask task={task} />}</TaskLoader>;
