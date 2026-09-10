"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export interface AuthUser {
  id: string;
  username: string;
}

const USER_CACHE_KEY = "studio_user_cache";

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
  // 首次渲染直接读取本地乐观缓存，彻底杜绝刷新页面时的登录状态闪烁
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? (JSON.parse(cached) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api-workspace-session", { cache: "no-store" });
      if (!res.ok) {
        try { localStorage.removeItem(USER_CACHE_KEY); } catch {}
        setUser(null);
        return null;
      }
      const data = await res.json();
      setConfigured(data.configured ?? true);
      if (data.authenticated && data.userId && data.username) {
        const authUser: AuthUser = { id: data.userId, username: data.username };
        try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(authUser)); } catch {}
        setUser(authUser);
        return authUser;
      } else {
        try { localStorage.removeItem(USER_CACHE_KEY); } catch {}
        setUser(null);
        return null;
      }
    } catch {
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
            try { localStorage.removeItem(USER_CACHE_KEY); } catch {}
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!ignore) {
          setConfigured(data.configured ?? true);
          if (data.authenticated && data.userId && data.username) {
            const authUser: AuthUser = { id: data.userId, username: data.username };
            try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(authUser)); } catch {}
            setUser(authUser);
          } else {
            try { localStorage.removeItem(USER_CACHE_KEY); } catch {}
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch {
        if (!ignore) {
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
      localStorage.removeItem(USER_CACHE_KEY);
    } catch {}
    setUser(null);
    window.dispatchEvent(new CustomEvent("auth-state-changed"));
    try {
      await fetch("/api-workspace-session", { method: "DELETE" });
    } catch {}
    return true;
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
