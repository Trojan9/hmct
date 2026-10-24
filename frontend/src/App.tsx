import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChangeStatusPage } from './pages/ChangeStatusPage';
import { DeleteTaskPage } from './pages/DeleteTaskPage';
import { PageNotFoundPage } from './pages/ErrorPages';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { CreateTaskPage, EditTaskPage } from './pages/TaskFormPages';
import { TaskListPage } from './pages/TaskListPage';

export const AppRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Navigate to="/tasks" replace />} />
      <Route path="tasks">
        <Route index element={<TaskListPage />} />
        <Route path="new" element={<CreateTaskPage />} />
        <Route path=":id" element={<TaskDetailPage />} />
        <Route path=":id/edit" element={<EditTaskPage />} />
        <Route path=":id/status" element={<ChangeStatusPage />} />
        <Route path=":id/delete" element={<DeleteTaskPage />} />
      </Route>
      <Route path="*" element={<PageNotFoundPage />} />
    </Route>
  </Routes>
);

export const App = ({ queryClient }: { queryClient: QueryClient }) => (
  <QueryClientProvider client={queryClient}>
    <AppRoutes />
  </QueryClientProvider>
);
