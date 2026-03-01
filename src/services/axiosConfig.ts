import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

const parseEnvNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const API_TIMEOUT_MS = parseEnvNumber(import.meta.env.VITE_API_TIMEOUT_MS, 10000);
const GET_RETRY_ATTEMPTS = parseEnvNumber(import.meta.env.VITE_API_GET_RETRIES, 2);
const GET_RETRY_DELAY_MS = parseEnvNumber(import.meta.env.VITE_API_GET_RETRY_DELAY_MS, 750);

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const shouldRetryGetRequest = (
  error: AxiosError,
  config?: RetryableRequestConfig,
): config is RetryableRequestConfig => {
  if (!config || config.method?.toUpperCase() !== 'GET') {
    return false;
  }

  const attempts = config._retryCount ?? 0;
  if (attempts >= GET_RETRY_ATTEMPTS) {
    return false;
  }

  if (error.code === 'ERR_CANCELED') {
    return false;
  }

  const status = error.response?.status;
  const isTimeout = error.code === 'ECONNABORTED';
  const isNetworkError = error.code === 'ERR_NETWORK' || !error.response;
  const isTemporaryServerError = status !== undefined && [502, 503, 504].includes(status);

  return isTimeout || isNetworkError || isTemporaryServerError;
};
/** Client for ticket-service */
export const ticketApiClient = axios.create({
  baseURL: import.meta.env.VITE_TICKET_SERVICE_URL ?? 'http://localhost:8000/api',
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Client for notification-service */
export const notificationApiClient = axios.create({
  baseURL: import.meta.env.VITE_NOTIFICATION_SERVICE_URL ?? 'http://localhost:8001/api',
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Client for assignment-service */
export const assignmentApiClient = axios.create({
  baseURL: import.meta.env.VITE_ASSIGNMENT_SERVICE_URL ?? 'http://localhost:8002/api',
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Client for users-service */
export const usersApiClient = axios.create({
  baseURL: import.meta.env.VITE_USERS_SERVICE_URL ?? 'http://localhost:8003/api',
  timeout: API_TIMEOUT_MS,
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
  await axios.post(
    `${usersBaseURL}/auth/refresh/`,
    {},
    {
      withCredentials: true,
      timeout: API_TIMEOUT_MS,
    },
  );
};
/**
 * Attach request/response interceptors to an axios client.
 * On 401 errors, waits for a single in-flight refresh and retries the request.
 * If refresh fails, redirects to /login.
 */
const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('/auth/me') || url.includes('/auth/refresh');
};

const attachInterceptors = (client: AxiosInstance): void => {
  client.interceptors.request.use(logRequest);
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      // Skip refresh logic for auth-checking endpoints to avoid infinite loop
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthEndpoint(originalRequest.url)
      ) {
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
          // Only redirect if not already on /login to avoid reload loop
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }

      if (shouldRetryGetRequest(error, originalRequest)) {
        originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
        await wait(GET_RETRY_DELAY_MS * originalRequest._retryCount);
        return client(originalRequest);
      }

      return logError(error);
    },
  );
};

attachInterceptors(ticketApiClient);
attachInterceptors(notificationApiClient);
attachInterceptors(assignmentApiClient);
attachInterceptors(usersApiClient);
