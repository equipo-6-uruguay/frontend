import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateTicket from '../../pages/tickets/CreateTicket';
import { ticketApi } from '../../services/ticketApi';
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

const mockRefreshUnread = vi.fn();
vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ trigger: 0, refreshUnread: mockRefreshUnread }),
}));

vi.mock('../../services/ticketApi', () => ({
  ticketApi: {
    createTicket: vi.fn(),
    getTickets: vi.fn(),
    getTicket: vi.fn(),
    getResponses: vi.fn(),
    deleteTicket: vi.fn(),
    updateStatus: vi.fn(),
    updatePriority: vi.fn(),
    createResponse: vi.fn(),
  },
}));

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@test.com',
  role: 'USER' as const,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

describe('CreateTicket Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isAdmin: false,
    });
  });

  it('renders the create ticket form', () => {
    render(
      <MemoryRouter>
        <CreateTicket />
      </MemoryRouter>
    );

    expect(screen.getByText('Crear Nuevo Ticket')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
  });

  it('creates ticket and navigates on success', async () => {
    vi.mocked(ticketApi.createTicket).mockResolvedValue({
      id: 1,
      title: 'Bug',
      description: 'Crash',
      status: 'OPEN',
      user_id: 'user-1',
      created_at: '2026-02-20T10:00:00Z',
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CreateTicket />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Título'), 'Bug');
    await user.type(screen.getByLabelText('Descripción'), 'Crash');
    await user.click(screen.getByRole('button', { name: 'Crear Ticket' }));

    await waitFor(() => {
      expect(ticketApi.createTicket).toHaveBeenCalledWith({
        title: 'Bug',
        description: 'Crash',
        user_id: 'user-1',
      });
    });

    expect(mockRefreshUnread).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/tickets');
  });

  it('shows error message on creation failure', async () => {
    vi.mocked(ticketApi.createTicket).mockRejectedValue({
      response: { data: { error: 'Validation error' } },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CreateTicket />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Título'), 'Bug');
    await user.type(screen.getByLabelText('Descripción'), 'Crash');
    await user.click(screen.getByRole('button', { name: 'Crear Ticket' }));

    await waitFor(() => {
      expect(screen.getByText('Validation error')).toBeInTheDocument();
    });
  });

  it('redirects to login when user is null', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: false,
      isAdmin: false,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CreateTicket />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Título'), 'Bug');
    await user.type(screen.getByLabelText('Descripción'), 'Crash');
    await user.click(screen.getByRole('button', { name: 'Crear Ticket' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
