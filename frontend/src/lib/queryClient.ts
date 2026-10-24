import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/tasks';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // Retry network and server errors once; a 4xx will not fix itself.
        retry: (failureCount, error) =>
          failureCount < 1 &&
          !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  });
