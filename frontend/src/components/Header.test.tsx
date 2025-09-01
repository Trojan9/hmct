import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Header from './Header';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Header', () => {
  it('renders the HMCTS Tasks title', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('HMCTS Tasks')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('has correct link destinations', () => {
    renderWithRouter(<Header />);
    
    const links = screen.getAllByRole('link');
    const tasksLink = links.find(link => link.textContent?.includes('Tasks'));
    const newTaskLink = links.find(link => link.textContent?.includes('New Task'));
    
    expect(tasksLink).toHaveAttribute('href', '/');
    expect(newTaskLink).toHaveAttribute('href', '/create');
  });
});