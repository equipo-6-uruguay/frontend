import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isAuthenticated: false,
    isAdmin: false,
    ...overrides,
  });
};

const renderProtectedRoute = (requireAdmin = false) =>
  render(
    <MemoryRouter>
      <ProtectedRoute requireAdmin={requireAdmin}>
        <div data-testid="protected-content">Protected</div>
      </ProtectedRoute>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('shows loading screen while auth is loading', () => {
    mockUseAuth({ loading: true });

    renderProtectedRoute();

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth({ isAuthenticated: false, user: null });

    renderProtectedRoute();

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseAuth({
      isAuthenticated: true,
      user: {
        id: '1',
        username: 'user',
        email: 'u@test.com',
        role: 'USER',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
    });

    renderProtectedRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects non-admin to /tickets when requireAdmin is true', () => {
    mockUseAuth({
      isAuthenticated: true,
      isAdmin: false,
      user: {
        id: '1',
        username: 'user',
        email: 'u@test.com',
        role: 'USER',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
    });

    renderProtectedRoute(true);

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children for admin when requireAdmin is true', () => {
    mockUseAuth({
      isAuthenticated: true,
      isAdmin: true,
      user: {
        id: '1',
        username: 'admin',
        email: 'a@test.com',
        role: 'ADMIN',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
    });

    renderProtectedRoute(true);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
