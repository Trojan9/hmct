import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskForm from './TaskForm';

vi.mock('../services/api', () => ({
  taskAPI: {
    createTask: vi.fn(),
    updateTask: vi.fn(),
    getTaskById: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create task form by default', () => {
    renderWithProviders(<TaskForm />);
    
    expect(screen.getByRole('heading', { name: /create new task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('renders required form fields', () => {
    renderWithProviders(<TaskForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('shows validation error for empty title', async () => {
    renderWithProviders(<TaskForm />);
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for past due date', async () => {
    renderWithProviders(<TaskForm />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const dueDateInput = screen.getByLabelText(/due date/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });
    fireEvent.change(dueDateInput, { target: { value: '2020-01-01T12:00' } });
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument();
    });
  });

  it('has cancel link that navigates back', () => {
    renderWithProviders(<TaskForm />);
    
    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/');
  });
});