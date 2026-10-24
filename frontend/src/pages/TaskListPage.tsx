import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SORT_OPTIONS, type SortOption, TASK_STATUSES, type TaskStatus } from '../api/tasks';
import { SuccessBanner } from '../components/NotificationBanner';
import { Pagination } from '../components/Pagination';
import { DueTag, StatusTag } from '../components/TaskTags';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFlashMessage } from '../hooks/useFlash';
import { formatDateTime } from '../tasks/dates';
import { useTasks } from '../tasks/queries';
import { STATUS_DISPLAY } from '../tasks/status';
import { ProblemWithServicePage } from './ErrorPages';

const DEFAULT_SORT: SortOption = 'dueDate-asc';

const isStatus = (value: string | null): value is TaskStatus =>
  TASK_STATUSES.includes(value as TaskStatus);
const isSort = (value: string | null): value is SortOption =>
  value !== null && value in SORT_OPTIONS;

/** Filter, sort and page live in the URL so views can be bookmarked and shared. */
const useListParams = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const sort = searchParams.get('sort');
  const page = Number(searchParams.get('page'));
  return {
    status: isStatus(status) ? status : undefined,
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
};

const buildHref = (params: { status?: TaskStatus; sort: SortOption; page?: number }) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.sort !== DEFAULT_SORT) search.set('sort', params.sort);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const query = search.toString();
  return query ? `/tasks?${query}` : '/tasks';
};

export const TaskListPage = () => {
  const { status, sort, page } = useListParams();
  const navigate = useNavigate();
  const flash = useFlashMessage();
  const { data, isPending, isError } = useTasks({ status, sort, page });
  useDocumentTitle('Tasks');

  if (isError) return <ProblemWithServicePage />;

  const counts = data?.meta.statusCounts;
  const allCount = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : undefined;
  const filterLabel = status ? STATUS_DISPLAY[status].label.toLowerCase() : undefined;

  const tabs: { label: string; status?: TaskStatus; count?: number }[] = [
    { label: 'All', count: allCount },
    ...TASK_STATUSES.map((s) => ({
      label: STATUS_DISPLAY[s].label,
      status: s,
      count: counts?.[s],
    })),
  ];

  return (
    <>
      {flash && <SuccessBanner message={flash} />}

      <div className="moj-page-header-actions">
        <div className="moj-page-header-actions__title">
          <h1 className="govuk-heading-l">Tasks</h1>
        </div>
        <div className="moj-page-header-actions__actions">
          <div className="moj-button-group moj-button-group--inline">
            <Link to="/tasks/new" role="button" draggable="false" className="govuk-button">
              Create a task
            </Link>
          </div>
        </div>
      </div>

      <nav className="moj-sub-navigation" aria-label="Filter tasks by status">
        <ul className="moj-sub-navigation__list">
          {tabs.map((tab) => (
            <li key={tab.label} className="moj-sub-navigation__item">
              <Link
                className="moj-sub-navigation__link"
                to={buildHref({ status: tab.status, sort })}
                aria-current={tab.status === status ? 'page' : undefined}
              >
                {tab.label}
                {tab.count !== undefined && ` (${tab.count})`}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form
        className="app-filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('sort') as SortOption;
          navigate(buildHref({ status, sort: value }));
        }}
      >
        <div className="govuk-form-group">
          <label className="govuk-label" htmlFor="sort">
            Sort by
          </label>
          <select className="govuk-select" id="sort" name="sort" key={sort} defaultValue={sort}>
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="govuk-button govuk-button--secondary">
          Apply
        </button>
      </form>

      {isPending ? (
        <p className="govuk-body" role="status">
          Loading tasks…
        </p>
      ) : data.data.length === 0 ? (
        <>
          <p className="govuk-body">
            {filterLabel ? `There are no ${filterLabel} tasks.` : 'There are no tasks yet.'}
          </p>
          <p className="govuk-body">
            <Link className="govuk-link" to="/tasks/new">
              Create a task
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="govuk-body app-results-count" role="status">
            Showing {(data.meta.page - 1) * data.meta.pageSize + 1} to{' '}
            {(data.meta.page - 1) * data.meta.pageSize + data.data.length} of {data.meta.total}{' '}
            {filterLabel ? `${filterLabel} ` : ''}
            {data.meta.total === 1 ? 'task' : 'tasks'}
          </p>

          <table className="govuk-table app-task-table">
            <caption className="govuk-table__caption govuk-visually-hidden">
              {filterLabel ? `Tasks with status ${filterLabel}` : 'All tasks'},{' '}
              {SORT_OPTIONS[sort].toLowerCase()}
            </caption>
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th scope="col" className="govuk-table__header govuk-!-width-one-half">
                  Task
                </th>
                <th scope="col" className="govuk-table__header">
                  Due
                </th>
                <th scope="col" className="govuk-table__header">
                  Status
                </th>
                <th scope="col" className="govuk-table__header">
                  <span className="govuk-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              {data.data.map((task) => (
                <tr key={task.id} className="govuk-table__row">
                  <td className="govuk-table__cell">
                    <Link className="govuk-link govuk-!-font-weight-bold" to={`/tasks/${task.id}`}>
                      {task.title}
                    </Link>
                    {task.description && (
                      <span className="app-task-table__description">
                        {task.description.length > 120
                          ? `${task.description.slice(0, 120).trimEnd()}…`
                          : task.description}
                      </span>
                    )}
                  </td>
                  <td className="govuk-table__cell app-task-table__tags" data-label="Due">
                    {formatDateTime(task.dueDate)}
                    <br />
                    <DueTag task={task} />
                  </td>
                  <td className="govuk-table__cell">
                    <StatusTag status={task.status} />
                  </td>
                  <td className="govuk-table__cell govuk-table__cell--numeric">
                    <Link
                      className="govuk-link app-task-table__action"
                      to={`/tasks/${task.id}/status`}
                    >
                      Change status<span className="govuk-visually-hidden"> of {task.title}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            hrefForPage={(p) => buildHref({ status, sort, page: p })}
          />
        </>
      )}
    </>
  );
};
