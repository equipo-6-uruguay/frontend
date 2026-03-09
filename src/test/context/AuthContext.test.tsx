import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { usersApiClient } from '../../services/axiosConfig';

vi.mock('../../services/axiosConfig', () => ({
  ticketApiClient: {
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  notificationApiClient: {
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  assignmentApiClient: {
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  usersApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@test.com',
  role: 'USER' as const,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

/** Build a JSON:API-shaped response matching what parseJsonApiUser expects */
const toJsonApiResponse = (user: { id: string; username: string; email: string; role: string; is_active: boolean; created_at: string }) => ({
  data: {
    id: user.id,
    attributes: {
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    },
  },
});

/** Helper to consume AuthContext in tests */
const AuthConsumer = () => {
  const { user, loading, isAuthenticated, isAdmin, login, logout, register } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => register('newuser', 'new@test.com', 'password')}>Register</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts loading and resolves with no user when /auth/me/ fails', async () => {
    vi.mocked(usersApiClient.get).mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('loads user from /auth/me/ on mount', async () => {
    vi.mocked(usersApiClient.get).mockResolvedValue({ data: toJsonApiResponse(mockUser) });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('testuser');
  });

  it('login calls /auth/login/ and sets user', async () => {
    vi.mocked(usersApiClient.get).mockRejectedValue(new Error('Unauthorized'));
    vi.mocked(usersApiClient.post).mockResolvedValue({ data: toJsonApiResponse(mockUser) });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('testuser');
    });

    expect(usersApiClient.post).toHaveBeenCalledWith('/auth/login/', {
      email: 'test@test.com',
      password: 'password',
    });
  });

  it('register calls /auth/ and sets user', async () => {
    vi.mocked(usersApiClient.get).mockRejectedValue(new Error('Unauthorized'));
    vi.mocked(usersApiClient.post).mockResolvedValue({ data: toJsonApiResponse(mockUser) });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('testuser');
    });

    expect(usersApiClient.post).toHaveBeenCalledWith('/auth/', {
      username: 'newuser',
      email: 'new@test.com',
      password: 'password',
    });
  });

  it('logout calls /auth/logout/ and clears user', async () => {
    vi.mocked(usersApiClient.get).mockResolvedValue({ data: toJsonApiResponse(mockUser) });
    vi.mocked(usersApiClient.post).mockResolvedValue({});

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('testuser');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
  });

  it('isAdmin is true when user role is ADMIN', async () => {
    const adminUser = { ...mockUser, role: 'ADMIN' as const };
    vi.mocked(usersApiClient.get).mockResolvedValue({ data: toJsonApiResponse(adminUser) });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin').textContent).toBe('true');
    });
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth debe usarse dentro de un AuthProvider'
    );
    consoleError.mockRestore();
  });
});
