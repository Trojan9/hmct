import { useEffect, useRef } from 'react';

export interface ErrorSummaryItem {
  /** id of the input to move focus to, or undefined for a page-level error. */
  href?: string;
  text: string;
}

/**
 * GOV.UK error summary. Takes focus when shown so screen reader users hear the
 * errors, and links move focus to the field rather than changing the URL.
 * https://design-system.service.gov.uk/components/error-summary/
 */
export const ErrorSummary = ({ errors }: { errors: ErrorSummaryItem[] }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) ref.current?.focus();
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div className="govuk-error-summary" ref={ref} tabIndex={-1}>
      <div role="alert">
        <h2 className="govuk-error-summary__title">There is a problem</h2>
        <div className="govuk-error-summary__body">
          <ul className="govuk-list govuk-error-summary__list">
            {errors.map((error) => (
              <li key={`${error.href}-${error.text}`}>
                {error.href ? (
                  <a
                    href={`#${error.href}`}
                    onClick={(event) => {
                      event.preventDefault();
                      const input = document.getElementById(error.href!);
                      input?.scrollIntoView({ block: 'center' });
                      input?.focus();
                    }}
                  >
                    {error.text}
                  </a>
                ) : (
                  error.text
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
