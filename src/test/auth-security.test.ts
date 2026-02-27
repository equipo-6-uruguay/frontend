import { describe, it, expect } from 'vitest';
import {
  ticketApiClient,
  notificationApiClient,
  assignmentApiClient,
  usersApiClient,
} from '../services/axiosConfig';

/**
 * Validates that all Axios clients are configured with withCredentials: true,
 * ensuring cookies (HttpOnly JWT tokens) are sent with every request.
 */
describe('Axios Config — withCredentials', () => {
  it('ticketApiClient has withCredentials: true', () => {
    expect(ticketApiClient.defaults.withCredentials).toBe(true);
  });

  it('notificationApiClient has withCredentials: true', () => {
    expect(notificationApiClient.defaults.withCredentials).toBe(true);
  });

  it('assignmentApiClient has withCredentials: true', () => {
    expect(assignmentApiClient.defaults.withCredentials).toBe(true);
  });

  it('usersApiClient has withCredentials: true', () => {
    expect(usersApiClient.defaults.withCredentials).toBe(true);
  });
});
