import { Link } from 'react-router-dom';
import { pageItems } from '../lib/pagination';

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

const Arrow = ({ direction }: { direction: 'prev' | 'next' }) => (
  <svg
    className={`govuk-pagination__icon govuk-pagination__icon--${direction}`}
    xmlns="http://www.w3.org/2000/svg"
    height="13"
    width="15"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 15 13"
  >
    <path
      d={
        direction === 'prev'
          ? 'm6.5938-0.0078125-6.7266 6.7266 6.7441 6.4062 1.377-1.449-4.1856-3.9768h12.896v-2h-12.984l4.2931-4.293-1.414-1.414z'
          : 'm8.107-0.0078125-1.4136 1.414 4.2926 4.293h-12.986v2h12.896l-4.1855 3.9766 1.377 1.4492 6.7441-6.4062-6.7246-6.7266z'
      }
    />
  </svg>
);

/** https://design-system.service.gov.uk/components/pagination/ */
export const Pagination = ({ page, totalPages, hrefForPage }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="govuk-pagination" aria-label="Pagination">
      {page > 1 && (
        <div className="govuk-pagination__prev">
          <Link className="govuk-link govuk-pagination__link" to={hrefForPage(page - 1)} rel="prev">
            <Arrow direction="prev" />
            <span className="govuk-pagination__link-title">
              Previous<span className="govuk-visually-hidden"> page</span>
            </span>
          </Link>
        </div>
      )}
      <ul className="govuk-pagination__list">
        {pageItems(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <li
              key={`ellipsis-${index}`}
              className="govuk-pagination__item govuk-pagination__item--ellipses"
            >
              &ctdot;
            </li>
          ) : (
            <li
              key={item}
              className={`govuk-pagination__item${item === page ? ' govuk-pagination__item--current' : ''}`}
            >
              <Link
                className="govuk-link govuk-pagination__link"
                to={hrefForPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < totalPages && (
        <div className="govuk-pagination__next">
          <Link className="govuk-link govuk-pagination__link" to={hrefForPage(page + 1)} rel="next">
            <span className="govuk-pagination__link-title">
              Next<span className="govuk-visually-hidden"> page</span>
            </span>
            <Arrow direction="next" />
          </Link>
        </div>
      )}
    </nav>
  );
};
