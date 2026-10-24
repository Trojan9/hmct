import { Link } from 'react-router-dom';
import type { Task } from '../api/tasks';
import { SuccessBanner } from '../components/NotificationBanner';
import { TaskLoader } from '../components/TaskLoader';
import { DueTag, StatusTag } from '../components/TaskTags';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFlashMessage } from '../hooks/useFlash';
import { formatDateTime } from '../tasks/dates';

const SummaryRow = ({
  label,
  children,
  change,
}: {
  label: string;
  children: React.ReactNode;
  change?: { to: string; hiddenText: string };
}) => (
  <div className="govuk-summary-list__row">
    <dt className="govuk-summary-list__key">{label}</dt>
    <dd className="govuk-summary-list__value">{children}</dd>
    {change ? (
      <dd className="govuk-summary-list__actions">
        <Link className="govuk-link" to={change.to}>
          Change<span className="govuk-visually-hidden"> {change.hiddenText}</span>
        </Link>
      </dd>
    ) : (
      <dd className="govuk-summary-list__actions" />
    )}
  </div>
);

const TaskDetail = ({ task }: { task: Task }) => {
  const flash = useFlashMessage();
  useDocumentTitle(task.title);

  return (
    <>
      <Link to="/tasks" className="govuk-back-link">
        Back to tasks
      </Link>

      {flash && <SuccessBanner message={flash} />}

      <span className="govuk-caption-l">Task</span>
      <h1 className="govuk-heading-l">{task.title}</h1>

      <dl className="govuk-summary-list">
        <SummaryRow
          label="Status"
          change={{ to: `/tasks/${task.id}/status`, hiddenText: 'status' }}
        >
          <StatusTag status={task.status} />
        </SummaryRow>
        <SummaryRow label="Due" change={{ to: `/tasks/${task.id}/edit`, hiddenText: 'due date' }}>
          {formatDateTime(task.dueDate)} <DueTag task={task} />
        </SummaryRow>
        <SummaryRow
          label="Description"
          change={{ to: `/tasks/${task.id}/edit`, hiddenText: 'description' }}
        >
          {task.description ? (
            <p className="govuk-body govuk-!-margin-bottom-0" style={{ whiteSpace: 'pre-line' }}>
              {task.description}
            </p>
          ) : (
            <span className="govuk-hint govuk-!-margin-bottom-0">No description</span>
          )}
        </SummaryRow>
        <SummaryRow label="Created">{formatDateTime(task.createdAt)}</SummaryRow>
        <SummaryRow label="Last updated">{formatDateTime(task.updatedAt)}</SummaryRow>
      </dl>

      <div className="govuk-button-group">
        <Link
          to={`/tasks/${task.id}/edit`}
          role="button"
          draggable="false"
          className="govuk-button govuk-button--secondary"
        >
          Edit task
        </Link>
        <Link
          to={`/tasks/${task.id}/delete`}
          role="button"
          draggable="false"
          className="govuk-button govuk-button--warning"
        >
          Delete task
        </Link>
      </div>
    </>
  );
};

export const TaskDetailPage = () => <TaskLoader>{(task) => <TaskDetail task={task} />}</TaskLoader>;
