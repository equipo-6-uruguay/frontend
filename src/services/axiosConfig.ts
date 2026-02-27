import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
/** Client for ticket-service */
export const ticketApiClient = axios.create({
  baseURL: import.meta.env.VITE_TICKET_SERVICE_URL ?? 'http://localhost:8000/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Client for notification-service */
export const notificationApiClient = axios.create({
  baseURL: import.meta.env.VITE_NOTIFICATION_SERVICE_URL ?? 'http://localhost:8001/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Client for assignment-service */
export const assignmentApiClient = axios.create({
  baseURL: import.meta.env.VITE_ASSIGNMENT_SERVICE_URL ?? 'http://localhost:8002/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Client for users-service */
export const usersApiClient = axios.create({
  baseURL: import.meta.env.VITE_USERS_SERVICE_URL ?? 'http://localhost:8003/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
/**
 * Request interceptor — logging only.
 * No manual token injection; cookies are sent automatically.
 */
const logRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  console.log(`→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
};

/**
 * Response error logger.
 */
const logError = (error: AxiosError): Promise<never> => {
  console.error('❌ API Error:', error.response?.status, error.message);
  return Promise.reject(error);
};

let refreshPromise: Promise<void> | null = null;
/**
 * Refreshes auth cookies using users-service endpoint.
 * Uses raw axios to avoid interceptor loops.
 */
const refreshAuthCookie = async (): Promise<void> => {
  const usersBaseURL = import.meta.env.VITE_USERS_SERVICE_URL ?? 'http://localhost:8003/api';
  await axios.post(`${usersBaseURL}/auth/refresh/`, {}, { withCredentials: true });
};
/**
 * Attach request/response interceptors to an axios client.
 * On 401 errors, waits for a single in-flight refresh and retries the request.
 * If refresh fails, redirects to /login.
 */
const attachInterceptors = (client: AxiosInstance): void => {
  client.interceptors.request.use(logRequest);
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = refreshAuthCookie().finally(() => {
              refreshPromise = null;
            });
          }
          await refreshPromise;
          return client(originalRequest);
        } catch {
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
      return logError(error);
    },
  );
};

attachInterceptors(ticketApiClient);
attachInterceptors(notificationApiClient);
attachInterceptors(assignmentApiClient);
attachInterceptors(usersApiClient);
