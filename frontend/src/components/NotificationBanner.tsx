import { useEffect, useRef } from 'react';

/**
 * GOV.UK success notification banner, used to confirm an action on the next page.
 * https://design-system.service.gov.uk/components/notification-banner/
 */
export const SuccessBanner = ({ message }: { message: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [message]);

  return (
    <div
      className="govuk-notification-banner govuk-notification-banner--success"
      role="alert"
      aria-labelledby="success-banner-title"
      tabIndex={-1}
      ref={ref}
    >
      <div className="govuk-notification-banner__header">
        <h2 className="govuk-notification-banner__title" id="success-banner-title">
          Success
        </h2>
      </div>
      <div className="govuk-notification-banner__content">
        <p className="govuk-notification-banner__heading">{message}</p>
      </div>
    </div>
  );
};
