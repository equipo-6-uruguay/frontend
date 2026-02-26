import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TicketList from '../../pages/tickets/TicketList';
import { ticketApi } from '../../services/ticketApi';
import { useAuth } from '../../context/AuthContext';
import type { Ticket } from '../../types/ticket';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/ticketApi', () => ({
  ticketApi: {
    getTickets: vi.fn(),
    getTicket: vi.fn(),
    getResponses: vi.fn(),
    createTicket: vi.fn(),
    deleteTicket: vi.fn(),
    updateStatus: vi.fn(),
    updatePriority: vi.fn(),
    createResponse: vi.fn(),
  },
}));

const mockTickets: Ticket[] = [
  {
    id: 1,
    title: 'Bug en login',
    description: 'No puedo acceder',
    status: 'OPEN',
    user_id: 'user-1',
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 2,
    title: 'Feature request',
    description: 'Agregar filtros',
    status: 'IN_PROGRESS',
    user_id: 'user-2',
    created_at: '2026-02-21T10:00:00Z',
  },
];

const adminUser = {
  id: 'admin-1',
  username: 'admin',
  email: 'admin@test.com',
  role: 'ADMIN' as const,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

const regularUser = {
  id: 'user-1',
  username: 'user',
  email: 'user@test.com',
  role: 'USER' as const,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

describe('TicketList Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isAdmin: true,
    });
    vi.mocked(ticketApi.getTickets).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <TicketList />
      </MemoryRouter>
    );

    expect(screen.getByText('Cargando tickets...')).toBeInTheDocument();
  });

  it('renders tickets for admin user', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isAdmin: true,
    });
    vi.mocked(ticketApi.getTickets).mockResolvedValue(mockTickets);

    render(
      <MemoryRouter>
        <TicketList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Panel de Tickets')).toBeInTheDocument();
    });

    expect(screen.getByText('Bug en login')).toBeInTheDocument();
    expect(screen.getByText('Feature request')).toBeInTheDocument();
    expect(screen.getByText('2 tickets encontrados')).toBeInTheDocument();
  });

  it('filters tickets for regular user (only their own)', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: regularUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isAdmin: false,
    });
    vi.mocked(ticketApi.getTickets).mockResolvedValue(mockTickets);

    render(
      <MemoryRouter>
        <TicketList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mis Tickets')).toBeInTheDocument();
    });

    expect(screen.getByText('Bug en login')).toBeInTheDocument();
    // user-2 ticket should not be visible
    expect(screen.queryByText('Feature request')).not.toBeInTheDocument();
  });

  it('shows empty state when no tickets', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isAdmin: true,
    });
    vi.mocked(ticketApi.getTickets).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <TicketList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No hay tickets registrados')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isAdmin: true,
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ticketApi.getTickets).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <TicketList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Cargando tickets...')).not.toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('deletes ticket after confirm', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isAdmin: true,
    });
    vi.mocked(ticketApi.getTickets).mockResolvedValue([mockTickets[0]]);
    vi.mocked(ticketApi.deleteTicket).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TicketList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bug en login')).toBeInTheDocument();
    });

    // Click delete button on the ticket item
    const deleteButton = screen.getByTitle('Eliminar ticket');
    await user.click(deleteButton);

    // Confirm modal should appear
    await waitFor(() => {
      expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument();
    });

    // Click the confirm delete button in the modal
    const confirmBtn = screen.getByText('Eliminar', { selector: '.confirm-btn--delete' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(ticketApi.deleteTicket).toHaveBeenCalledWith(1);
    });
  });
});
