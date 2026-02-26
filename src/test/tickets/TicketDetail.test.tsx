import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TicketDetail from '../../pages/tickets/TicketDetail';
import { ticketApi } from '../../services/ticketApi';
import type { Ticket, TicketResponse } from '../../types/ticket';

// ---------------------------------------------------------------------------
// Mocks — same pattern as NotificationList.test.tsx / AssignmentList.test.tsx
// ---------------------------------------------------------------------------

// useSSE abre conexiones EventSource y requiere NotificationProvider.
// En los tests de TicketDetail no interesa probar SSE (eso tiene su propia suite);
// se mockea para aislar el componente de esa dependencia de infraestructura.
vi.mock('../../hooks/useSSE', () => ({
  useSSE: vi.fn(),
}));

vi.mock('../../services/ticketApi', () => ({
  ticketApi: {
    getTickets: vi.fn(),
    getTicket: vi.fn(),
    getResponses: vi.fn(),
    createTicket: vi.fn(),
    deleteTicket: vi.fn(),
    updateStatus: vi.fn(),
    createResponse: vi.fn(),
    updatePriority: vi.fn(),
  },
}));

// Mock AuthContext — the component uses useAuth() for authentication state
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock ToastContext — the component uses useToast() for notifications
export const mockShowToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('../../components/common', () => ({
  LoadingState: ({ message }: { message?: string }) => (
    <div data-testid="loading-state">{message || 'Loading...'}</div>
  ),
  EmptyState: ({ message }: { message: string }) => (
    <div data-testid="empty-state">{message}</div>
  ),
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle}
    </div>
  ),
}));

import { useAuth } from '../../context/AuthContext';

// ---------------------------------------------------------------------------
// Auth helper — builds the return value for useAuth mock
// ---------------------------------------------------------------------------

const mockUseAuth = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isAuthenticated: true,
    isAdmin: false,
    ...overrides,
  });
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockTicket: Ticket = {
  id: 42,
  title: 'Bug en el login',
  description: 'No puedo iniciar sesión',
  status: 'OPEN',
  user_id: 'user-123',
  created_at: '2026-02-10T08:00:00Z',
};

const mockResponses: TicketResponse[] = [
  {
    id: 1,
    ticket_id: 42,
    admin_id: 'admin-001',
    admin_name: 'Admin Uno',
    text: 'Estamos revisando tu caso',
    created_at: '2026-02-11T09:00:00Z',
  },
  {
    id: 2,
    ticket_id: 42,
    admin_id: 'admin-002',
    admin_name: 'Admin Dos',
    text: 'El problema ha sido identificado',
    created_at: '2026-02-12T14:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Helper — render component inside the /tickets/:id route
// ---------------------------------------------------------------------------

const renderTicketDetail = (ticketId = '42') => {
  return render(
    <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetail />} />
      </Routes>
    </MemoryRouter>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// ===========================================================================
// HU-1.2: Visualización de prioridad en detalle del ticket
// ===========================================================================

describe('TicketDetail — HU-1.2: Visualización de prioridad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth({
      user: { id: 'user-123', email: 'user@test.com', username: 'testuser', role: 'USER', is_active: true, created_at: '2026-01-01T00:00:00Z' },
      isAuthenticated: true,
      isAdmin: false,
    });
    vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
  });

  it('llama a ticketApi.getTicket con el id del parámetro de ruta', async () => {
    vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, priority: 'High' });
    renderTicketDetail();
    await waitFor(() => {
      expect(ticketApi.getTicket).toHaveBeenCalledWith(42);
    });
  });

  it('muestra "Alta" cuando el ticket tiene priority "High"', async () => {
    vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, priority: 'High' });
    renderTicketDetail();
    await waitFor(() => {
      expect(screen.getByText('Alta')).toBeInTheDocument();
    });
  });

  it('muestra "Baja" cuando el ticket tiene priority "Low"', async () => {
    vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, priority: 'Low' });
    renderTicketDetail();
    await waitFor(() => {
      expect(screen.getByText('Baja')).toBeInTheDocument();
    });
  });

  it('muestra "Media" cuando el ticket tiene priority "Medium"', async () => {
    vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, priority: 'Medium' });
    renderTicketDetail();
    await waitFor(() => {
      expect(screen.getByText('Media')).toBeInTheDocument();
    });
  });

  it('muestra "Unassigned" cuando el ticket no tiene prioridad', async () => {
    vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, priority: undefined });
    renderTicketDetail();
    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });
});

describe('TicketDetail — HU-3.1: Sección Respuestas', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user is the ticket creator
    mockUseAuth({
      user: { id: 'user-123', email: 'user@test.com', username: 'testuser', role: 'USER', is_active: true, created_at: '2026-01-01T00:00:00Z' },
      isAuthenticated: true,
      isAdmin: false,
    });
  });

  // -----------------------------------------------------------------------
  // Scenario: Detalle muestra respuestas existentes (2 respuestas)
  // -----------------------------------------------------------------------
  describe('cuando hay respuestas', () => {
    beforeEach(() => {
      vi.mocked(ticketApi.getTicket).mockResolvedValue(mockTicket);
      vi.mocked(ticketApi.getResponses).mockResolvedValue(mockResponses);
    });

    it('muestra la sección "Respuestas" con las 2 respuestas', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByText('Respuestas')).toBeInTheDocument();
      });

      expect(screen.getByText('Estamos revisando tu caso')).toBeInTheDocument();
      expect(screen.getByText('El problema ha sido identificado')).toBeInTheDocument();
    });

    it('muestra el nombre del admin en cada respuesta', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByText('Admin Uno')).toBeInTheDocument();
        expect(screen.getByText('Admin Dos')).toBeInTheDocument();
      });
    });

    it('muestra las respuestas en orden cronológico ascendente (más antigua primero)', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByText('Estamos revisando tu caso')).toBeInTheDocument();
      });

      const responseTexts = screen
        .getAllByTestId('response-item')
        .map((el) => el.textContent);

      // La primera respuesta renderizada debe ser la más antigua
      expect(responseTexts[0]).toContain('Estamos revisando tu caso');
      expect(responseTexts[1]).toContain('El problema ha sido identificado');
    });

    it('muestra la fecha de cada respuesta', async () => {
      renderTicketDetail();

      await waitFor(() => {
        // We expect formatted dates to appear — the component may format them,
        // so we check for the year as a minimal assertion.
        const items = screen.getAllByTestId('response-item');
        expect(items[0]).toHaveTextContent(/2026/);
        expect(items[1]).toHaveTextContent(/2026/);
      });
    });
  });

  // -----------------------------------------------------------------------
  // Scenario: Detalle sin respuestas (empty state)
  // -----------------------------------------------------------------------
  describe('cuando no hay respuestas', () => {
    beforeEach(() => {
      vi.mocked(ticketApi.getTicket).mockResolvedValue(mockTicket);
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
    });

    it('muestra mensaje de empty state', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(
          screen.getByText('Aún no hay respuestas para este ticket'),
        ).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Scenario: Usuario no creador y no admin → acceso restringido
  // -----------------------------------------------------------------------
  describe('cuando el usuario no es creador ni admin', () => {
    beforeEach(() => {
      mockUseAuth({
        user: { id: 'user-999', email: 'otro@test.com', username: 'otrousuario', role: 'USER', is_active: true, created_at: '2026-01-01T00:00:00Z' },
        isAuthenticated: true,
        isAdmin: false,
      });

      vi.mocked(ticketApi.getTicket).mockResolvedValue(mockTicket);
      // The API might reject, or the component might hide — either way, responses should NOT show
      vi.mocked(ticketApi.getResponses).mockResolvedValue(mockResponses);
    });

    it('no muestra la sección de respuestas', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.queryByText('Estamos revisando tu caso')).not.toBeInTheDocument();
        expect(screen.queryByText('El problema ha sido identificado')).not.toBeInTheDocument();
      });
    });

    it('muestra un mensaje de acceso restringido', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(
          screen.getByText(/acceso restringido|no tienes permiso/i),
        ).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Scenario: Admin puede ver respuestas de cualquier ticket
  // -----------------------------------------------------------------------
  describe('cuando el usuario es ADMIN (no creador)', () => {
    beforeEach(() => {
      mockUseAuth({
        user: { id: 'admin-001', email: 'admin@test.com', username: 'adminuser', role: 'ADMIN', is_active: true, created_at: '2026-01-01T00:00:00Z' },
        isAuthenticated: true,
        isAdmin: true,
      });

      vi.mocked(ticketApi.getTicket).mockResolvedValue(mockTicket);
      vi.mocked(ticketApi.getResponses).mockResolvedValue(mockResponses);
    });

    it('muestra las respuestas aunque no sea el creador', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByText('Respuestas')).toBeInTheDocument();
        expect(screen.getByText('Estamos revisando tu caso')).toBeInTheDocument();
        expect(screen.getByText('El problema ha sido identificado')).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Scenario: Loading state mientras carga
  // -----------------------------------------------------------------------
  describe('estado de carga', () => {
    it('muestra loading mientras se obtiene el ticket', () => {
      vi.mocked(ticketApi.getTicket).mockImplementation(() => new Promise(() => {}));
      vi.mocked(ticketApi.getResponses).mockImplementation(() => new Promise(() => {}));

      renderTicketDetail();

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// HU-3.2: Formulario de respuesta del ADMIN
// ===========================================================================

describe('TicketDetail — HU-3.2: Formulario de respuesta (solo ADMIN, ticket no CLOSED)', () => {
  // ---------------------------------------------------------------------------
  // Fixtures locales
  // ---------------------------------------------------------------------------

  const adminUser = {
    id: 'admin-001',
    email: 'admin@test.com',
    username: 'adminuser',
    role: 'ADMIN' as const,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  const regularUser = {
    id: 'user-123',
    email: 'user@test.com',
    username: 'testuser',
    role: 'USER' as const,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  const newResponse: TicketResponse = {
    id: 99,
    ticket_id: 42,
    admin_id: 'admin-001',
    admin_name: 'adminuser',
    text: 'Esta es la nueva respuesta del admin',
    created_at: '2026-02-20T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // -------------------------------------------------------------------------
  // Visibilidad: ADMIN + OPEN → formulario visible
  // -------------------------------------------------------------------------
  describe('cuando ADMIN y ticket OPEN', () => {
    beforeEach(() => {
      mockUseAuth({ user: adminUser, isAuthenticated: true, isAdmin: true });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, status: 'OPEN' });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
    });

    it('muestra textarea con data-testid="response-textarea"', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });
    });

    it('muestra botón "Responder"', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
      });
    });

    it('muestra contador "0 / 2000" al cargar', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByText('0 / 2000')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Visibilidad: ADMIN + IN_PROGRESS → formulario visible
  // -------------------------------------------------------------------------
  describe('cuando ADMIN y ticket IN_PROGRESS', () => {
    beforeEach(() => {
      mockUseAuth({ user: adminUser, isAuthenticated: true, isAdmin: true });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({
        ...mockTicket,
        status: 'IN_PROGRESS',
      });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
    });

    it('muestra el formulario de respuesta', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
      });
    });

    it('muestra contador "0 / 2000" al cargar', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByText('0 / 2000')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Visibilidad: rol USER → sin formulario
  // -------------------------------------------------------------------------
  describe('cuando el usuario es USER (no ADMIN)', () => {
    beforeEach(() => {
      mockUseAuth({ user: regularUser, isAuthenticated: true, isAdmin: false });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, status: 'OPEN' });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
    });

    it('no muestra textarea de respuesta', async () => {
      renderTicketDetail();
      // Esperamos a que el componente cargue el título
      await waitFor(() => {
        expect(screen.getByText('Bug en el login')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('response-textarea')).not.toBeInTheDocument();
    });

    it('no muestra botón "Responder"', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByText('Bug en el login')).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /responder/i })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Visibilidad: CLOSED → sin formulario + aviso
  // -------------------------------------------------------------------------
  describe('cuando ADMIN y ticket CLOSED', () => {
    beforeEach(() => {
      mockUseAuth({ user: adminUser, isAuthenticated: true, isAdmin: true });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({
        ...mockTicket,
        status: 'CLOSED',
      });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
    });

    it('no muestra textarea de respuesta', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByText('Bug en el login')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('response-textarea')).not.toBeInTheDocument();
    });

    it('no muestra botón "Responder"', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByText('Bug en el login')).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /responder/i })).not.toBeInTheDocument();
    });

    it('muestra aviso de ticket cerrado', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(
          screen.getByText(/ticket cerrado|no se pueden añadir más respuestas/i),
        ).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Estado del botón: deshabilitado si textarea vacío
  // -------------------------------------------------------------------------
  describe('estado del botón Responder', () => {
    beforeEach(() => {
      mockUseAuth({ user: adminUser, isAuthenticated: true, isAdmin: true });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, status: 'OPEN' });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
    });

    it('está deshabilitado cuando el textarea está vacío', async () => {
      renderTicketDetail();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /responder/i })).toBeDisabled();
      });
    });

    it('se habilita al escribir texto en el textarea', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('response-textarea'), {
        target: { value: 'Una respuesta válida' },
      });

      expect(screen.getByRole('button', { name: /responder/i })).toBeEnabled();
    });

    it('vuelve a deshabilitarse si el texto se borra', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });

      const textarea = screen.getByTestId('response-textarea');
      fireEvent.change(textarea, { target: { value: 'Texto' } });
      expect(screen.getByRole('button', { name: /responder/i })).toBeEnabled();

      fireEvent.change(textarea, { target: { value: '' } });
      expect(screen.getByRole('button', { name: /responder/i })).toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Límite de 2000 caracteres
  // -------------------------------------------------------------------------
  describe('límite de 2000 caracteres', () => {
    beforeEach(() => {
      mockUseAuth({ user: adminUser, isAuthenticated: true, isAdmin: true });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, status: 'OPEN' });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
    });

    it('actualiza el contador al escribir texto', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByText('0 / 2000')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('response-textarea'), {
        target: { value: 'Hola' },
      });

      expect(screen.getByText('4 / 2000')).toBeInTheDocument();
    });

    it('el textarea tiene maxLength=2000', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });

      const textarea = screen.getByTestId('response-textarea') as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(2000);
    });

    it('muestra "2000 / 2000" al alcanzar el límite exacto', async () => {
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });

      const textarea = screen.getByTestId('response-textarea');
      fireEvent.change(textarea, { target: { value: 'a'.repeat(2000) } });

      expect(screen.getByText('2000 / 2000')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Submit exitoso
  // -------------------------------------------------------------------------
  describe('envío exitoso de respuesta', () => {
    beforeEach(() => {
      mockUseAuth({ user: adminUser, isAuthenticated: true, isAdmin: true });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, status: 'OPEN' });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
      vi.mocked(ticketApi.createResponse).mockResolvedValue(newResponse);
    });

    const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('response-textarea'), {
        target: { value: 'Esta es la nueva respuesta del admin' },
      });
      await user.click(screen.getByRole('button', { name: /responder/i }));
    };

    it('llama a ticketApi.createResponse con el ticketId y el texto', async () => {
      const user = userEvent.setup();
      renderTicketDetail();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(ticketApi.createResponse).toHaveBeenCalledWith(
          42,
          'Esta es la nueva respuesta del admin',
          'admin-001',
        );
      });
    });

    it('la nueva respuesta aparece en la lista', async () => {
      const user = userEvent.setup();
      renderTicketDetail();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByText('Esta es la nueva respuesta del admin'),
        ).toBeInTheDocument();
      });
    });

    it('limpia el textarea tras submit exitoso', async () => {
      const user = userEvent.setup();
      renderTicketDetail();
      await fillAndSubmit(user);

      await waitFor(() => {
        const textarea = screen.getByTestId(
          'response-textarea',
        ) as HTMLTextAreaElement;
        expect(textarea.value).toBe('');
      });
    });

    it('el contador vuelve a "0 / 2000" tras submit exitoso', async () => {
      const user = userEvent.setup();
      renderTicketDetail();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByText('0 / 2000')).toBeInTheDocument();
      });
    });

    it('muestra confirmación mediante Toast', async () => {
      const user = userEvent.setup();
      renderTicketDetail();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringMatching(/respuesta enviada|respuesta añadida/i),
          'success'
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Submit fallido → muestra error
  // -------------------------------------------------------------------------
  describe('error al enviar respuesta', () => {
    beforeEach(() => {
      mockUseAuth({ user: adminUser, isAuthenticated: true, isAdmin: true });
      vi.mocked(ticketApi.getTicket).mockResolvedValue({ ...mockTicket, status: 'OPEN' });
      vi.mocked(ticketApi.getResponses).mockResolvedValue([]);
      vi.mocked(ticketApi.createResponse).mockRejectedValue(new Error('Network Error'));
    });

    it('muestra Toast con mensaje de error si la API falla', async () => {
      const user = userEvent.setup();
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('response-textarea'), {
        target: { value: 'Una respuesta cualquiera' },
      });
      await user.click(screen.getByRole('button', { name: /responder/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringMatching(/error|no se pudo enviar/i),
          'error'
        );
      });
    });

    it('el textarea conserva el texto si el envío falla', async () => {
      const user = userEvent.setup();
      renderTicketDetail();

      await waitFor(() => {
        expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      });

      const textarea = screen.getByTestId('response-textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Una respuesta cualquiera' } });
      await user.click(screen.getByRole('button', { name: /responder/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalled();
      });

      expect(textarea.value).toBe('Una respuesta cualquiera');
    });
  });
});
