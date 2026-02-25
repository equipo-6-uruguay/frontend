import { useSSE } from '../../hooks/useSSE';

/**
 * Mounts the global SSE connection to update the notification badge.
 * Only active on authenticated routes where the user is NOT on
 * TicketDetail (that route opens its own scoped SSE connection).
 */
const SSEGlobalListener = () => {
  useSSE();
  return null;
};

export default SSEGlobalListener;
