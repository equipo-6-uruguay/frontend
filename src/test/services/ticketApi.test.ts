import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ticketApi } from '../../services/ticketApi';
import { ticketApiClient } from '../../services/axiosConfig';
import type { Ticket, TicketResponse } from '../../types/ticket';

vi.mock('../../services/axiosConfig', () => ({
  ticketApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { withCredentials: true },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
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
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

const mockTicket: Ticket = {
  id: 1,
  title: 'Test Ticket',
  description: 'Test description',
  status: 'OPEN',
  user_id: 'user-1',
  created_at: '2026-02-20T10:00:00Z',
};

const mockResponse: TicketResponse = {
  id: 1,
  ticket_id: 1,
  admin_id: 'admin-1',
  admin_name: 'Admin',
  text: 'Response text',
  created_at: '2026-02-21T10:00:00Z',
};

describe('ticketApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTickets', () => {
    it('fetches all tickets from /tickets/', async () => {
      vi.mocked(ticketApiClient.get).mockResolvedValue({ data: [mockTicket] });

      const result = await ticketApi.getTickets();

      expect(ticketApiClient.get).toHaveBeenCalledWith('/tickets/');
      expect(result).toEqual([mockTicket]);
    });
  });

  describe('getTicket', () => {
    it('fetches a single ticket by ID', async () => {
      vi.mocked(ticketApiClient.get).mockResolvedValue({ data: mockTicket });

      const result = await ticketApi.getTicket(1);

      expect(ticketApiClient.get).toHaveBeenCalledWith('/tickets/1/');
      expect(result).toEqual(mockTicket);
    });

    it('accepts string ID', async () => {
      vi.mocked(ticketApiClient.get).mockResolvedValue({ data: mockTicket });

      await ticketApi.getTicket('42');

      expect(ticketApiClient.get).toHaveBeenCalledWith('/tickets/42/');
    });
  });

  describe('getResponses', () => {
    it('fetches responses for a ticket', async () => {
      vi.mocked(ticketApiClient.get).mockResolvedValue({ data: [mockResponse] });

      const result = await ticketApi.getResponses(1);

      expect(ticketApiClient.get).toHaveBeenCalledWith('/tickets/1/responses/');
      expect(result).toEqual([mockResponse]);
    });
  });

  describe('createTicket', () => {
    it('creates a new ticket via POST', async () => {
      const dto = { title: 'New', description: 'Desc', user_id: 'u1' };
      vi.mocked(ticketApiClient.post).mockResolvedValue({ data: { ...mockTicket, ...dto } });

      const result = await ticketApi.createTicket(dto);

      expect(ticketApiClient.post).toHaveBeenCalledWith('/tickets/', dto);
      expect(result.title).toBe('New');
    });
  });

  describe('deleteTicket', () => {
    it('deletes a ticket by ID', async () => {
      vi.mocked(ticketApiClient.delete).mockResolvedValue({});

      await ticketApi.deleteTicket(1);

      expect(ticketApiClient.delete).toHaveBeenCalledWith('/tickets/1/');
    });
  });

  describe('updateStatus', () => {
    it('patches ticket status', async () => {
      const updated = { ...mockTicket, status: 'IN_PROGRESS' as const };
      vi.mocked(ticketApiClient.patch).mockResolvedValue({ data: updated });

      const result = await ticketApi.updateStatus(1, 'IN_PROGRESS');

      expect(ticketApiClient.patch).toHaveBeenCalledWith('/tickets/1/status/', { status: 'IN_PROGRESS' });
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('updatePriority', () => {
    it('patches ticket priority with justification', async () => {
      const updated = { ...mockTicket, priority: 'High' as const };
      const payload = { priority: 'High' as const, justification: 'Urgent' };
      vi.mocked(ticketApiClient.patch).mockResolvedValue({ data: updated });

      const result = await ticketApi.updatePriority(1, payload);

      expect(ticketApiClient.patch).toHaveBeenCalledWith('/tickets/1/priority/', payload);
      expect(result.priority).toBe('High');
    });
  });

  describe('createResponse', () => {
    it('posts admin response to a ticket', async () => {
      vi.mocked(ticketApiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await ticketApi.createResponse(1, 'Response text', 'admin-1');

      expect(ticketApiClient.post).toHaveBeenCalledWith('/tickets/1/responses/', {
        text: 'Response text',
        admin_id: 'admin-1',
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
