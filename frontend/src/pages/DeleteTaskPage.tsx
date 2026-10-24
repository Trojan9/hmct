import { Link } from 'react-router-dom';
import type { Task } from '../api/tasks';
import { ErrorSummary } from '../components/ErrorSummary';
import { TaskLoader } from '../components/TaskLoader';
import { StatusTag } from '../components/TaskTags';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNavigateWithFlash } from '../hooks/useFlash';
import { formatDateTime } from '../tasks/dates';
import { useDeleteTask } from '../tasks/queries';

/**
 * Deleting cannot be undone, so it gets its own confirmation page rather than
 * a browser confirm() dialog.
 * https://design-system.service.gov.uk/components/button/#warning-buttons
 */
const DeleteTaskConfirmation = ({ task }: { task: Task }) => {
  const mutation = useDeleteTask(task.id);
  const navigateWithFlash = useNavigateWithFlash();
  useDocumentTitle('Delete task', mutation.isError);

  return (
    <>
      <Link to={`/tasks/${task.id}`} className="govuk-back-link">
        Back
      </Link>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          {mutation.isError && (
            <ErrorSummary errors={[{ text: 'The task could not be deleted. Try again.' }]} />
          )}
          <span className="govuk-caption-l">{task.title}</span>
          <h1 className="govuk-heading-l">Are you sure you want to delete this task?</h1>

          <dl className="govuk-summary-list">
            <div className="govuk-summary-list__row">
              <dt className="govuk-summary-list__key">Status</dt>
              <dd className="govuk-summary-list__value">
                <StatusTag status={task.status} />
              </dd>
            </div>
            <div className="govuk-summary-list__row">
              <dt className="govuk-summary-list__key">Due</dt>
              <dd className="govuk-summary-list__value">{formatDateTime(task.dueDate)}</dd>
            </div>
          </dl>

          <div className="govuk-warning-text">
            <span className="govuk-warning-text__icon" aria-hidden="true">
              !
            </span>
            <strong className="govuk-warning-text__text">
              <span className="govuk-visually-hidden">Warning</span>
              You cannot undo this.
            </strong>
          </div>

          <div className="govuk-button-group">
            <button
              type="button"
              className="govuk-button govuk-button--warning"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(undefined, {
                  onSuccess: () => navigateWithFlash('/tasks', `Task ‘${task.title}’ deleted`),
                })
              }
            >
              Yes, delete task
            </button>
            <Link className="govuk-link" to={`/tasks/${task.id}`}>
              No, go back
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export const DeleteTaskPage = () => (
  <TaskLoader>{(task) => <DeleteTaskConfirmation task={task} />}</TaskLoader>
);
