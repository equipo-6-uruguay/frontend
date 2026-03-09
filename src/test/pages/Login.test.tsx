import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import Login from '../../pages/auth/Login';
import { useAuth } from '../../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockLogin = vi.fn();

const mockUseAuth = (overrides = {}) => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isAuthenticated: false,
    isAdmin: false,
    ...overrides,
  });
};

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth();
  });

  it('renders login form with email and password fields', () => {
    renderLogin();

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderLogin();

    expect(screen.getByText(/crear cuenta nueva/i)).toBeInTheDocument();
  });

  it('calls login and navigates on successful submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/tickets', { replace: true });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciales inválidas'));
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });
  });

  it('displays generic error when error has no message', async () => {
    mockLogin.mockRejectedValue({});
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Error al iniciar sesión. Intenta nuevamente.')).toBeInTheDocument();
    });
  });

  it('displays friendly message on 401 AxiosError', async () => {
    const axiosError = new AxiosError('Request failed with status code 401', '401', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() }
    });
    mockLogin.mockRejectedValue(axiosError);
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('El usuario y/o contraseña son incorrectos.')).toBeInTheDocument();
    });
  });
});
