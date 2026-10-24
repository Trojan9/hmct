import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** https://design-system.service.gov.uk/patterns/page-not-found-pages/ */
export const PageNotFoundPage = () => {
  useDocumentTitle('Page not found');
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <h1 className="govuk-heading-l">Page not found</h1>
        <p className="govuk-body">If you typed the web address, check it is correct.</p>
        <p className="govuk-body">
          If you pasted the web address, check you copied the entire address.
        </p>
        <p className="govuk-body">
          <Link className="govuk-link" to="/tasks">
            Go to your tasks
          </Link>
        </p>
      </div>
    </div>
  );
};

/** Shown when a task id in the URL does not exist (for example, it was deleted). */
export const TaskNotFoundPage = () => {
  useDocumentTitle('Task not found');
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <h1 className="govuk-heading-l">Task not found</h1>
        <p className="govuk-body">The task may have been deleted.</p>
        <p className="govuk-body">
          <Link className="govuk-link" to="/tasks">
            Go to your tasks
          </Link>
        </p>
      </div>
    </div>
  );
};

/** https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/ */
export const ProblemWithServicePage = () => {
  useDocumentTitle('Sorry, there is a problem with the service');
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <h1 className="govuk-heading-l">Sorry, there is a problem with the service</h1>
        <p className="govuk-body">Try again later.</p>
        <p className="govuk-body">Any changes you were making have not been saved.</p>
      </div>
    </div>
  );
};
