"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
  syncDataNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      return syncService.getUser();
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return syncService.checkAuthStatus();
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalConfig, setAuthModalConfig] = useState<AuthModalConfig>({
    isOpen: false,
  });

  const isInitialMount = useRef(true);

  // Validate session against server
  const validateSessionAndSync = useCallback(async (initial = false) => {
    if (typeof window === "undefined") return;
    const token = syncService.getAuthToken();

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    if (initial) {
      setIsLoading(true);
    }

    // Safety timeout: Ensure initial isLoading is released within 3s max
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    try {
      const { valid, user: verifiedUser } = await syncService.validateSession();
      if (valid && verifiedUser) {
        setUser(verifiedUser);
        setIsAuthenticated(true);
      } else {
        // Token was invalid or expired
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Auth validation error:", err);
      // Fallback: check local storage if offline
      const localUser = syncService.getUser();
      if (localUser && syncService.checkAuthStatus()) {
        setUser(localUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      validateSessionAndSync(true);
    }

    const handleStorageChange = () => {
      const token = syncService.getAuthToken();
      const currentUser = syncService.getUser();
      if (token && currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-state-changed", handleStorageChange);
    window.addEventListener("auth-session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-state-changed", handleStorageChange);
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, [validateSessionAndSync]);

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

  const syncDataNow = useCallback(async () => {
    if (syncService.checkAuthStatus()) {
      await syncService.downloadFromServer();
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await syncService.login(username, password);
    if (result.success) {
      const currentUser = syncService.getUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      window.dispatchEvent(new Event("auth-state-changed"));

      // Download from database on new device login to guarantee latest data
      try {
        await syncService.downloadFromServer();
      } catch (err) {
        console.error("Download after login error:", err);
      }
    }
    return result;
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const result = await syncService.register(username, password);
    if (result.success) {
      const currentUser = syncService.getUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      window.dispatchEvent(new Event("auth-state-changed"));

      // If this device has initial local data, upload it to cloud database
      try {
        if (syncService.detectLocalData()) {
          await syncService.uploadToServer(true);
        }
      } catch (err) {
        console.error("Initial upload after register error:", err);
      }
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    syncService.logout();
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("auth-state-changed"));
  }, []);

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
        syncDataNow,
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
