import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
    return 'https://mcubecafe-backend.onrender.com/api';
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

// In-memory token storage (not localStorage — avoid XSS risk)
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach Bearer token to every request if available
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // Do not attempt token refresh for auth endpoints themselves
    const isAuthEndpoint =
      requestUrl.includes('/auth/refresh/') ||
      requestUrl.includes('/auth/login/') ||
      requestUrl.includes('/auth/admin-login/') ||
      requestUrl.includes('/auth/signup/') ||
      requestUrl.includes('/auth/logout/');

    // Skip retry for notification polling — not critical, avoid noise
    if (requestUrl.includes('/notifications/')) {
      return Promise.reject(error);
    }

    const isAuth = localStorage.getItem('is_authenticated') === 'true';
    const storedRefreshToken = localStorage.getItem('refresh_token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && (isAuth || storedRefreshToken)) {
      originalRequest._retry = true;

      try {
        const payload = storedRefreshToken ? { refresh_token: storedRefreshToken } : {};
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          payload,
          { withCredentials: true }
        );
        // Update the stored token from refresh response
        if (refreshRes.data?.access_token) {
          setAccessToken(refreshRes.data.access_token);
        }
        if (refreshRes.data?.refresh_token) {
          localStorage.setItem('refresh_token', refreshRes.data.refresh_token);
        }
        // Retry the original request with the new token
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        localStorage.removeItem('is_authenticated');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');

        // Refresh failed — only redirect if accessing a protected route
        const protectedRoutes = ['/checkout', '/payment', '/orders', '/admin-dashboard'];
        const isProtectedRoute = protectedRoutes.some((route) =>
          window.location.pathname.startsWith(route)
        );

        if (isProtectedRoute) {
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

