"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as syncService from "@/lib/syncService";

interface User {
  id: string;
  username: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface AuthModalConfig {
  isOpen: boolean;
  reason?: string;
  onSuccess?: () => void;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalConfig: AuthModalConfig;
  openAuthModal: (reason?: string, onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalConfig, setAuthModalConfig] = useState<AuthModalConfig>({
    isOpen: false,
  });

  const checkAuth = useCallback(() => {
    if (typeof window === "undefined") return;
    const token = syncService.getAuthToken();
    const currentUser = syncService.getUser();

    if (token && currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-state-changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-state-changed", handleStorageChange);
    };
  }, [checkAuth]);

  const openAuthModal = useCallback((reason?: string, onSuccess?: () => void) => {
    setAuthModalConfig({
      isOpen: true,
      reason,
      onSuccess,
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalConfig((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await syncService.login(username, password);
    if (result.success) {
      checkAuth();
      window.dispatchEvent(new Event("auth-state-changed"));
      
      // Auto trigger download from server after login to sync user data
      try {
        await syncService.downloadFromServer();
      } catch (err) {
        console.error("Download after login error:", err);
      }
    }
    return result;
  }, [checkAuth]);

  const register = useCallback(async (username: string, password: string) => {
    const result = await syncService.register(username, password);
    if (result.success) {
      checkAuth();
      window.dispatchEvent(new Event("auth-state-changed"));
    }
    return result;
  }, [checkAuth]);

  const logout = useCallback(() => {
    syncService.logout();
    checkAuth();
    window.dispatchEvent(new Event("auth-state-changed"));
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        authModalConfig,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
