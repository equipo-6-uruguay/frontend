import type { AdminUser } from '../types/user';
import { usersApiClient } from './axiosConfig';

export type { AdminUser };

// Define the expected API response structure based on JSON:API format
interface JsonApiUserResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: Omit<AdminUser, 'id'> & { created_at?: string };
    links?: Record<string, string>;
  }>;
  meta?: Record<string, unknown>;
}

export const userService = {
  /**
   * Obtener usuarios por rol
   */
  getUsersByRole: async (role: 'ADMIN' | 'USER'): Promise<AdminUser[]> => {
    const { data } = await usersApiClient.get<JsonApiUserResponse | AdminUser[]>(`/auth/by-role/${role}/`);
    
    // Handle JSON:API formatted response
    if (data && 'data' in data && Array.isArray(data.data)) {
      return data.data.map((item) => ({
        id: item.id,
        username: item.attributes.username,
        email: item.attributes.email,
        role: item.attributes.role,
        is_active: item.attributes.is_active,
      }));
    }
    
    // Handle flat array response (fallback)
    if (Array.isArray(data)) {
      return data as AdminUser[];
    }
    
    return [];
  },

  /**
   * Obtener solo usuarios con rol ADMIN
   */
  getAdminUsers: async (): Promise<AdminUser[]> => {
    return userService.getUsersByRole('ADMIN');
  },
};
