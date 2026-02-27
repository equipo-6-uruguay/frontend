import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../hooks/useSSE', () => ({
  useSSE: vi.fn(),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ trigger: 0, refreshUnread: vi.fn() }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn(), isDark: false }),
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

describe('Layout', () => {
  it('renders children on auth pages without navbar', () => {
    mockUseAuth({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Layout>
          <div data-testid="child">Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    // Navbar should not be present on auth pages
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders navbar when authenticated on non-auth page', () => {
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

    render(
      <MemoryRouter initialEntries={['/tickets']}>
        <Layout>
          <div data-testid="child">Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
