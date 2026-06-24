import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if there's an active session (cookie or stored token)
  useEffect(() => {
    let mounted = true;
    authApi
      .getMe()
      .then((data) => {
        if (mounted) setUser(data.user);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    return authApi.register({ name, email, password });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  const updateUserLocal = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserLocal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
