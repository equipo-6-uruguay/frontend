/**
 * RED tests — HU-1.2: Visualizar prioridad en listado (TicketItem)
 *
 * Estos tests deben fallar hasta que TicketItem implemente la
 * visualización de prioridad.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TicketItem from '../../pages/tickets/TicketItem';
import type { Ticket, TicketPriority } from '../../types/ticket';

// Mock AuthContext — TicketItem uses useAuth() for role checks
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '42', username: 'testuser', email: 'test@test.com', role: 'USER', is_active: true, created_at: '2026-01-01T00:00:00Z' },
    isAuthenticated: true,
    isAdmin: false,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

/** Ticket base sin prioridad (campo ausente) */
const baseTicket: Ticket = {
  id: 1,
  title: 'Test ticket',
  description: 'Test description',
  status: 'OPEN',
  user_id: '42',
  created_at: '2026-02-20T10:00:00Z',
};

const noop = vi.fn();

const renderTicketItem = (ticket: Ticket) =>
  render(
    <BrowserRouter>
      <TicketItem
        ticket={ticket}
        onDelete={noop}
        onUpdateStatus={noop}
      />
    </BrowserRouter>
  );

describe('TicketItem – visualización de prioridad (HU-1.2)', () => {
  it('muestra "Unassigned" cuando el ticket no tiene prioridad', () => {
    // El ticket NO incluye el campo priority
    renderTicketItem(baseTicket);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('muestra "Alta" cuando priority === "High"', () => {
    const ticketWithPriority: Ticket = { ...baseTicket, priority: 'High' as TicketPriority };

    renderTicketItem(ticketWithPriority);

    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('muestra "Baja" cuando priority === "Low"', () => {
    const ticketWithPriority: Ticket = { ...baseTicket, priority: 'Low' as TicketPriority };

    renderTicketItem(ticketWithPriority);

    expect(screen.getByText('Baja')).toBeInTheDocument();
  });

  it('muestra "Media" cuando priority === "Medium"', () => {
    const ticketWithPriority: Ticket = { ...baseTicket, priority: 'Medium' as TicketPriority };

    renderTicketItem(ticketWithPriority);

    expect(screen.getByText('Media')).toBeInTheDocument();
  });

  it('muestra "Sin prioridad" cuando priority === "Unassigned"', () => {
    const ticketWithPriority: Ticket = { ...baseTicket, priority: 'Unassigned' as TicketPriority };

    renderTicketItem(ticketWithPriority);

    expect(screen.getByText('Sin prioridad')).toBeInTheDocument();
  });
});
