import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskList from './TaskList';
import { taskAPI } from '../services/api';

vi.mock('../services/api', () => ({
  taskAPI: {
    getAllTasks: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test description 1',
    status: 'PENDING' as const,
    dueDate: '2024-12-31T12:00:00Z',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Test description 2',
    status: 'COMPLETED' as const,
    dueDate: '2024-12-31T12:00:00Z',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
];

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskAPI.getAllTasks).mockResolvedValue(mockTasks);
  });

  it('renders task management heading', async () => {
    renderWithProviders(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText('Task Management')).toBeInTheDocument();
    });
  });

  it('renders create task button', async () => {
    renderWithProviders(<TaskList />);
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Task');
      expect(createButton.closest('a')).toHaveAttribute('href', '/create');
    });
  });

  it('displays tasks when loaded', async () => {
    renderWithProviders(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(taskAPI.getAllTasks).mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<TaskList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('filters tasks by status', async () => {
    renderWithProviders(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    
    const completedFilter = screen.getByRole('button', { name: /completed/i });
    fireEvent.click(completedFilter);
    
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    vi.mocked(taskAPI.getAllTasks).mockResolvedValue([]);
    renderWithProviders(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
    });
  });

  it('has edit and delete buttons for each task', async () => {
    renderWithProviders(<TaskList />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByTitle(/edit task/i);
      const deleteButtons = screen.getAllByTitle(/delete task/i);
      
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });
});