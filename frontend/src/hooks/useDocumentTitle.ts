import { useEffect } from 'react';

export const SERVICE_NAME = 'Caseworker tasks';

/**
 * Sets the page title in the GOV.UK format, prefixed with "Error:" when the
 * page has validation errors so screen reader users hear it first.
 * https://design-system.service.gov.uk/patterns/validation/#how-to-tell-the-user-about-validation-errors
 */
export const useDocumentTitle = (pageTitle: string, hasErrors = false) => {
  useEffect(() => {
    document.title = `${hasErrors ? 'Error: ' : ''}${pageTitle} – ${SERVICE_NAME} – HMCTS`;
  }, [pageTitle, hasErrors]);
};
