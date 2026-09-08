import { createContext, useEffect, useState, useCallback } from 'react';
import { loginUser, registerUser, fetchCurrentUser } from '../services/authService';
import { getToken, setToken, clearAuth, getStoredUser, setStoredUser } from '../utils/token';
import { getErrorMessage } from '../services/api';
import { connectSocket, disconnectSocket } from '../socket/socket';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [isLoading, setIsLoading] = useState(true); // true while restoring session on first load
  const [authError, setAuthError] = useState(null);

  // On first mount: if a token exists, verify it's still valid and refresh the user.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const freshUser = await fetchCurrentUser();
        if (!cancelled) {
          setUser(freshUser);
          setStoredUser(freshUser);
          connectSocket();
        }
      } catch (err) {
        if (!cancelled) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async ({ name, email, password, confirmPassword }) => {
    setAuthError(null);
    try {
      const { user: newUser, token } = await registerUser({ name, email, password, confirmPassword });
      return { user: newUser, token };
    } catch (err) {
      const message = getErrorMessage(err);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const { user: loggedInUser, token } = await loginUser({ email, password });
      setToken(token);
      setStoredUser(loggedInUser);
      setUser(loggedInUser);
      connectSocket();
      return loggedInUser;
    } catch (err) {
      const message = getErrorMessage(err);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    clearAuth();
    setUser(null);
  }, []);

  const updateLocalUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      setStoredUser(next);
      return next;
    });
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    authError,
    login,
    register,
    logout,
    updateLocalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
