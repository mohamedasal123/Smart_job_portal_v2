import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';
import { getRoleRedirect, normalizeRole } from '../utils/constants';
import { AuthContext } from './authContext';

// SECURITY: We deliberately do NOT persist the user object (name, email, role, …)
// to localStorage. localStorage is readable by any script that runs in this
// origin, including any XSS payload. Authentication state lives entirely in the
// Sanctum HTTP-only session cookie; we rehydrate the user on app boot by
// calling /auth/me. While that request is in flight, ProtectedRoute shows a
// brief spinner via isBootstrapping — that's the price of doing this safely.

const LEGACY_USER_KEY = 'user';

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    role: normalizeRole(user.role),
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Start true: we haven't verified the session with the server yet.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const persistUser = useCallback((nextUser) => {
    const normalizedUser = normalizeUser(nextUser);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await authApi.getCurrentUser();
    return persistUser(response.data);
  }, [persistUser]);

  const patchUser = useCallback((patch) => {
    setUser((prev) => prev ? { ...prev, ...patch } : prev);
  }, []);

  // On every mount, validate the session against the server.
  useEffect(() => {
    let isMounted = true;

    // Clear any user object left behind by older builds that wrote to localStorage.
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LEGACY_USER_KEY);
      }
    } catch {
      // Ignore: localStorage may be unavailable (private mode, SSR, …).
    }

    authApi
      .getCurrentUser()
      .then((response) => {
        if (isMounted) persistUser(response.data);
      })
      .catch(() => {
        // Session invalid/expired — leave user as null.
        if (isMounted) persistUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [persistUser]);

  const login = useCallback(
    async (payload) => {
      setError(null);

      try {
        await authApi.login(payload);
        const meResponse = await authApi.getCurrentUser();
        const nextUser = persistUser(meResponse.data);

        return {
          success: true,
          redirectTo: getRoleRedirect(nextUser?.role),
        };
      } catch (requestError) {
        setError(requestError);
        throw requestError;
      }
    },
    [persistUser],
  );

  const register = useCallback(
    async (payload) => {
      setError(null);

      try {
        const response = await authApi.register(payload);
        if (response.data) {
          persistUser(response.data);
        }
        return response;
      } catch (requestError) {
        setError(requestError);
        throw requestError;
      }
    },
    [persistUser],
  );

  const logout = useCallback(async () => {
    setError(null);

    try {
      await authApi.logout();
    } finally {
      persistUser(null);
    }
  }, [persistUser]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(user),
      isBootstrapping: isLoading,
      isLoading,
      error,
      login,
      logout,
      patchUser,
      refreshUser,
      register,
    }),
    [error, isLoading, login, logout, patchUser, refreshUser, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
