import type { AdminUser } from '../types/user';
import { usersApiClient } from './axiosConfig';

export type { AdminUser };

export const userService = {
  /**
   * Obtener usuarios por rol
   */
  getUsersByRole: async (role: 'ADMIN' | 'USER'): Promise<AdminUser[]> => {
    const { data } = await usersApiClient.get<AdminUser[]>(`/auth/by-role/${role}/`);
    return data;
  },

  /**
   * Obtener solo usuarios con rol ADMIN
   */
  getAdminUsers: async (): Promise<AdminUser[]> => {
    return userService.getUsersByRole('ADMIN');
  },
};
