import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../services/user';
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
    defaults: { withCredentials: true },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

const mockAdmins = [
  { id: '1', username: 'admin1', email: 'admin1@test.com', role: 'ADMIN', is_active: true },
];

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsersByRole', () => {
    it('fetches users by ADMIN role (flat array fallback)', async () => {
      vi.mocked(usersApiClient.get).mockResolvedValue({ data: mockAdmins });

      const result = await userService.getUsersByRole('ADMIN');

      expect(usersApiClient.get).toHaveBeenCalledWith('/auth/by-role/ADMIN/');
      expect(result).toEqual(mockAdmins);
    });

    it('fetches users by ADMIN role (JSON:API format)', async () => {
      const jsonApiMock = {
        data: {
          data: [
            {
              id: '2',
              type: 'users',
              attributes: {
                username: 'admin2',
                email: 'admin2@test.com',
                role: 'ADMIN',
                is_active: true,
              },
            },
          ],
        },
      };

      vi.mocked(usersApiClient.get).mockResolvedValue(jsonApiMock);

      const result = await userService.getUsersByRole('ADMIN');

      expect(usersApiClient.get).toHaveBeenCalledWith('/auth/by-role/ADMIN/');
      expect(result).toEqual([
        { id: '2', username: 'admin2', email: 'admin2@test.com', role: 'ADMIN', is_active: true },
      ]);
    });

    it('fetches users by USER role', async () => {
      vi.mocked(usersApiClient.get).mockResolvedValue({ data: [] });

      const result = await userService.getUsersByRole('USER');

      expect(usersApiClient.get).toHaveBeenCalledWith('/auth/by-role/USER/');
      expect(result).toEqual([]);
    });
  });

  describe('getAdminUsers', () => {
    it('delegates to getUsersByRole with ADMIN', async () => {
      vi.mocked(usersApiClient.get).mockResolvedValue({ data: mockAdmins });

      const result = await userService.getAdminUsers();

      expect(usersApiClient.get).toHaveBeenCalledWith('/auth/by-role/ADMIN/');
      expect(result).toEqual(mockAdmins);
    });
  });
});
