import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  kycStatus: "pending" | "approved" | "rejected";
  walletBalance: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const logoutFn = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fv_token");
    localStorage.removeItem("fv_user");
    setLocation("/login");
  };

  const fetchMe = async (currentToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const { token: freshToken, ...freshUser } = await res.json();
        setUser(freshUser);
        localStorage.setItem("fv_user", JSON.stringify(freshUser));
        if (freshToken) {
          setToken(freshToken);
          localStorage.setItem("fv_token", freshToken);
        }
        return true;
      }
      return false;
    } catch {
      // keep the stored user if network fails
      return true;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("fv_token");
        const storedUser = localStorage.getItem("fv_user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          const ok = await fetchMe(storedToken);
          if (!ok) logoutFn();
        }
      } catch (error) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem("fv_token");
    if (!currentToken) return;
    await fetchMe(currentToken);
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("fv_token", newToken);
    localStorage.setItem("fv_user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout: logoutFn, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
