import axios from 'axios';

// Default to a relative path: in dev Vite proxies /api to the local Express
// server, and in production the SPA and API share one Vercel origin. Set
// VITE_API_URL only when the backend lives on a different host.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ailifeos-token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // The server runs in UTC; send the browser's offset so "today", streaks,
    // weekly charts and greetings follow the user's own calendar and clock.
    // Same convention as Date#getTimezoneOffset (minutes, UTC minus local).
    if ((config.method || 'get').toLowerCase() === 'get') {
      config.params = { ...(config.params || {}), tzOffset: new Date().getTimezoneOffset() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const CREDENTIAL_CHECKS = ['/auth/login', '/auth/register', '/auth/password'];

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from these endpoints means "wrong credentials", not "session
    // expired": wiping the token and redirecting there logged users out for
    // mistyping their current password in Settings.
    const url = error.config?.url || '';
    const isCredentialCheck = CREDENTIAL_CHECKS.some((path) => url.includes(path));
    if (error.response?.status === 401 && !isCredentialCheck) {
      localStorage.removeItem('ailifeos-token');
      localStorage.removeItem('ailifeos-user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
