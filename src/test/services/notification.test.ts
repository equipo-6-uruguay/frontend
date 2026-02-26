import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationsApi } from '../../services/notification';
import { notificationApiClient } from '../../services/axiosConfig';

vi.mock('../../services/axiosConfig', () => ({
  ticketApiClient: {
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  notificationApiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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

const apiResponse = {
  id: 5,
  ticket_id: '42',
  message: 'New ticket assigned',
  sent_at: '2026-02-20T10:00:00Z',
  read: false,
};

describe('notificationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('fetches and adapts notifications', async () => {
      vi.mocked(notificationApiClient.get).mockResolvedValue({ data: [apiResponse] });

      const result = await notificationsApi.getNotifications();

      expect(notificationApiClient.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          id: '5',
          title: 'Ticket #42',
          message: 'New ticket assigned',
          read: false,
          createdAt: '2026-02-20T10:00:00Z',
        },
      ]);
    });
  });

  describe('markAsRead', () => {
    it('patches notification as read', async () => {
      vi.mocked(notificationApiClient.patch).mockResolvedValue({});

      await notificationsApi.markAsRead('5');

      expect(notificationApiClient.patch).toHaveBeenCalledWith('/notifications/5/read/', {}, { signal: undefined });
    });
  });

  describe('clearAll', () => {
    it('deletes all notifications', async () => {
      vi.mocked(notificationApiClient.delete).mockResolvedValue({});

      await notificationsApi.clearAll();

      expect(notificationApiClient.delete).toHaveBeenCalledWith('/notifications/clear/', { signal: undefined });
    });
  });

  describe('deleteNotification', () => {
    it('deletes a single notification', async () => {
      vi.mocked(notificationApiClient.delete).mockResolvedValue({});

      await notificationsApi.deleteNotification('5');

      expect(notificationApiClient.delete).toHaveBeenCalledWith('/notifications/5/', { signal: undefined });
    });
  });
});
