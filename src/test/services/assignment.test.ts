import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignmentsApi } from '../../services/assignment';
import { assignmentApiClient } from '../../services/axiosConfig';
import type { Assignment } from '../../types/assignment';

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
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  usersApiClient: {
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

const apiResponse = {
  id: 1,
  ticket_id: 'T-100',
  priority: 'high' as const,
  assigned_at: '2026-02-20T10:00:00Z',
  assigned_to: 'agent-1',
};

const expectedAssignment: Assignment = {
  id: 1,
  ticket_id: 'T-100',
  priority: 'high',
  assigned_at: '2026-02-20T10:00:00Z',
  assigned_to: 'agent-1',
};

describe('assignmentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAssignments', () => {
    it('fetches and adapts assignments', async () => {
      vi.mocked(assignmentApiClient.get).mockResolvedValue({ data: [apiResponse] });

      const result = await assignmentsApi.getAssignments();

      expect(assignmentApiClient.get).toHaveBeenCalledWith('/assignments/', { signal: undefined });
      expect(result).toEqual([expectedAssignment]);
    });

    it('supports paginated assignment responses', async () => {
      vi.mocked(assignmentApiClient.get).mockResolvedValue({
        data: {
          count: 1,
          next: null,
          previous: null,
          results: [apiResponse],
        },
      });

      const result = await assignmentsApi.getAssignments();

      expect(result).toEqual([expectedAssignment]);
    });

    it('passes AbortSignal when provided', async () => {
      const controller = new AbortController();
      vi.mocked(assignmentApiClient.get).mockResolvedValue({ data: [] });

      await assignmentsApi.getAssignments(controller.signal);

      expect(assignmentApiClient.get).toHaveBeenCalledWith('/assignments/', { signal: controller.signal });
    });

    it('throws when assignment payload has an unexpected shape', async () => {
      vi.mocked(assignmentApiClient.get).mockResolvedValue({ data: { detail: 'unexpected' } });

      await expect(assignmentsApi.getAssignments()).rejects.toThrow('Formato inválido de asignaciones');
    });
  });

  describe('deleteAssignment', () => {
    it('deletes assignment by ID', async () => {
      vi.mocked(assignmentApiClient.delete).mockResolvedValue({});

      await assignmentsApi.deleteAssignment(1);

      expect(assignmentApiClient.delete).toHaveBeenCalledWith('/assignments/1/', { signal: undefined });
    });
  });

  describe('assignUser', () => {
    it('patches assignment with user ID and adapts response', async () => {
      vi.mocked(assignmentApiClient.patch).mockResolvedValue({ data: apiResponse });

      const result = await assignmentsApi.assignUser(1, 'agent-1');

      expect(assignmentApiClient.patch).toHaveBeenCalledWith(
        '/assignments/1/assign-user/',
        { assigned_to: 'agent-1' },
        { signal: undefined }
      );
      expect(result).toEqual(expectedAssignment);
    });
  });
});
