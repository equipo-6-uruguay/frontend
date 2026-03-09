import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import Register from '../../pages/auth/Register';
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

const mockRegister = vi.fn();

const mockUseAuth = (overrides = {}) => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isAuthenticated: false,
    isAdmin: false,
    ...overrides,
  });
};

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth();
  });

  it('renders register form with all fields', () => {
    renderRegister();

    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByText('Mínimo 8 caracteres, 1 mayúscula y 1 símbolo')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'different');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'short');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'short');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register and navigates on success', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'newuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'new@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@test.com', 'password123');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/tickets', { replace: true });
  });

  it('displays error on registration failure', async () => {
    mockRegister.mockRejectedValue(new Error('Email ya registrado'));
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'newuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'dup@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText('Email ya registrado')).toBeInTheDocument();
    });
  });

  it('renders link to login page', () => {
    renderRegister();

    expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
  });

  it('displays specific validation message from the backend on 422 AxiosError', async () => {
    const axiosError = new AxiosError('Request failed with status code 422', '422', undefined, undefined, {
      status: 422,
      statusText: 'Unprocessable Entity',
      data: { errors: [{ detail: 'Password must contain at least one uppercase letter.' }] },
      headers: {},
      config: { headers: new AxiosHeaders() }
    });
    mockRegister.mockRejectedValue(axiosError);
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'newuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'dup@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter.')).toBeInTheDocument();
    });
  });
});
