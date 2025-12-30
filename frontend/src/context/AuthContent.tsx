import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/api/axios";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type UserRole = "admin" | "manager" | "staff";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role:  UserRole;
}

interface AuthContextType {
  user:  User | null;
  isLoading:  boolean;

  // Role checks
  isAdmin: boolean;
  isManager: boolean;
  isStaff:  boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password:  string) => Promise<void>;
  logout: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// SIMPLE TOKEN HELPERS (inline - no import needed)
// ═══════════════════════════════════════════════════════════════════

const getToken = (): string | null => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

const setToken = (token: string): void => {
  try {
    localStorage. setItem("token", token);
  } catch {
    console.error("Failed to save token");
  }
};

const clearToken = (): void => {
  try {
    localStorage. removeItem("token");
  } catch {
    console.error("Failed to clear token");
  }
};

// ═══════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children:  ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (! token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (error) {
        console.error("Auth check failed:", error);
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (username: string, password:  string) => {
    const formData = new FormData();
    formData.append("username", username);
    formData. append("password", password);

    const res = await api. post("/auth/login", formData, {
      headers: { "Content-Type":  "multipart/form-data" },
    });

    setToken(res.data.access_token);

    const userRes = await api.get("/auth/me");
    setUser(userRes.data);
  };

  // Register
  const register = async (username: string, email:  string, password: string) => {
    await api.post("/auth/register", { username, email, password });
  };

  // Logout
  const logout = () => {
    clearToken();
    setUser(null);
  };

  // ═══════════════════════════════════════════════════════════════════
  // ROLE CHECKS
  // ═══════════════════════════════════════════════════════════════════

  const isAdmin = user?.role === "admin";
  const isManager = user?. role === "manager";
  const isStaff = user?. role === "staff";

  const canCreate = isAdmin || isManager;
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isManager,
        isStaff,
        canCreate,
        canEdit,
        canDelete,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default AuthContext;