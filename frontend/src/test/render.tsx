import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import { expect } from 'vitest';
import { App } from '../App';

/** Renders the whole app at a URL, with a fresh cache and no retries. */
export const renderApp = (path: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <App queryClient={queryClient} />
    </MemoryRouter>,
  );
  return { ...result, user };
};

/**
 * Runs axe-core against the rendered page. Colour contrast is skipped because
 * jsdom does not compute styles; it was checked in a real browser instead.
 */
export const expectNoAccessibilityViolations = async (container: Element) => {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
};
