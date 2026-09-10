"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export interface AuthUser {
  id: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  configured: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  refreshSession: () => Promise<AuthUser | null>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api-workspace-session", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      setConfigured(data.configured ?? true);
      if (data.authenticated && data.userId && data.username) {
        const authUser: AuthUser = { id: data.userId, username: data.username };
        setUser(authUser);
        return authUser;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const syncSession = async () => {
      try {
        const res = await fetch("/api-workspace-session", { cache: "no-store" });
        if (!res.ok) {
          if (!ignore) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!ignore) {
          setConfigured(data.configured ?? true);
          if (data.authenticated && data.userId && data.username) {
            setUser({ id: data.userId, username: data.username });
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch {
        if (!ignore) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    void syncSession();

    const handleFocus = () => {
      void syncSession();
    };
    const handleAuthChange = () => {
      void syncSession();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("auth-state-changed", handleAuthChange);
    return () => {
      ignore = true;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("auth-state-changed", handleAuthChange);
    };
  }, []);

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api-workspace-session", { method: "DELETE" });
      if (res.ok) {
        setUser(null);
        window.dispatchEvent(new CustomEvent("auth-state-changed"));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        configured,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        refreshSession,
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
