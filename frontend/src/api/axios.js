import axios from 'axios';
import i18n from '../i18n';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || 'http://127.0.0.1:8000';

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
};

const attachXsrfToken = (config) => {
  const token = getCookie('XSRF-TOKEN');
  config.headers = config.headers || {};

  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }

  config.headers['X-Locale'] = i18n.language || 'en';

  return config;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export const backend = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

api.interceptors.request.use(attachXsrfToken);
backend.interceptors.request.use(attachXsrfToken);

// ─── Global response interceptors ─────────────────────────────────────────────

const onResponseError = (error) => {
  const status = error?.response?.status;
  const url    = error?.config?.url || '';

  // 401 — session expired. Redirect to login EXCEPT for the /auth/me
  // bootstrap call (that 401 is expected when the user is not logged in
  // and is handled gracefully by AuthContext itself).
  if (status === 401 && !url.includes('/auth/me')) {
    const path = window.location.pathname;
    const isAuthPage = path.startsWith('/login') || path.startsWith('/register');
    if (!isAuthPage) {
      // Preserve the user's destination so they're sent back after login
      // instead of dumped on the dashboard. The login page reads this off
      // sessionStorage on submit and clears it afterwards.
      try {
        sessionStorage.setItem('postLoginRedirect', path + window.location.search);
      } catch {
        // sessionStorage may be unavailable (private mode / SSR) — non-fatal.
      }
      window.location.href = '/login';
    }
  }

  // 404s are no longer silently rewritten to empty success envelopes.
  // Callers should catch real "not found" cases explicitly — pretending
  // a 404 is a successful empty response makes it impossible to distinguish
  // "the user has zero notifications" from "the notifications endpoint
  // doesn't exist," and it forced every caller to write defensive
  // `res.data?.data?.data || res.data?.data || []` chains.

  return Promise.reject(error);
};

api.interceptors.response.use((r) => r, onResponseError);
backend.interceptors.response.use((r) => r, onResponseError);

/**
 * Extract a list payload from a Laravel JSON envelope, regardless of whether
 * the endpoint paginates or returns a bare array.
 *
 * - Plain list:       { success, data: [...] }                  → returns [...]
 * - Paginated list:   { success, data: { data: [...], total } } → returns [...]
 * - Anything else:    returns []
 *
 * Call sites should use this instead of writing
 * `res.data?.data?.data || res.data?.data || []` cascades.
 */
export const getListItems = (response) => {
  const envelope = response?.data;
  const payload = envelope?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default api;
