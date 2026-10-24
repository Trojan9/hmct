import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TASK_STATUSES, type Task, type TaskStatus } from '../api/tasks';
import { ErrorSummary } from '../components/ErrorSummary';
import { TaskLoader } from '../components/TaskLoader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNavigateWithFlash } from '../hooks/useFlash';
import { useUpdateTaskStatus } from '../tasks/queries';
import { STATUS_DISPLAY } from '../tasks/status';

const ChangeStatusForm = ({ task }: { task: Task }) => {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const mutation = useUpdateTaskStatus(task.id);
  const navigate = useNavigate();
  const navigateWithFlash = useNavigateWithFlash();
  const taskUrl = `/tasks/${task.id}`;
  useDocumentTitle('Change status', mutation.isError);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (status === task.status) {
      navigate(taskUrl);
      return;
    }
    mutation.mutate(status, {
      onSuccess: () =>
        navigateWithFlash(
          taskUrl,
          `Status changed to ${STATUS_DISPLAY[status].label.toLowerCase()}`,
        ),
    });
  };

  return (
    <>
      <Link to={taskUrl} className="govuk-back-link">
        Back
      </Link>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          {mutation.isError && (
            <ErrorSummary
              errors={[{ text: 'The status could not be changed. Try again.', href: 'status' }]}
            />
          )}
          <form onSubmit={onSubmit} noValidate>
            <div className="govuk-form-group">
              <fieldset className="govuk-fieldset">
                <legend className="govuk-fieldset__legend govuk-fieldset__legend--l">
                  <span className="govuk-caption-l">{task.title}</span>
                  <h1 className="govuk-fieldset__heading">What is the status of this task?</h1>
                </legend>
                <div className="govuk-radios" data-module="govuk-radios">
                  {TASK_STATUSES.map((value, index) => (
                    <div className="govuk-radios__item" key={value}>
                      <input
                        className="govuk-radios__input"
                        id={index === 0 ? 'status' : `status-${value}`}
                        name="status"
                        type="radio"
                        value={value}
                        checked={status === value}
                        onChange={() => setStatus(value)}
                        aria-describedby={`status-${value}-hint`}
                      />
                      <label
                        className="govuk-label govuk-radios__label"
                        htmlFor={index === 0 ? 'status' : `status-${value}`}
                      >
                        {STATUS_DISPLAY[value].label}
                      </label>
                      <div id={`status-${value}-hint`} className="govuk-hint govuk-radios__hint">
                        {STATUS_DISPLAY[value].hint}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="govuk-button-group">
              <button type="submit" className="govuk-button" disabled={mutation.isPending}>
                Save status
              </button>
              <Link className="govuk-link" to={taskUrl}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export const ChangeStatusPage = () => (
  <TaskLoader>{(task) => <ChangeStatusForm task={task} />}</TaskLoader>
);
