import api from "./axios";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password:  string;
  full_name?:  string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id:  number;
  username: string;
  email: string;
  full_name:  string | null;
  role: "admin" | "manager" | "staff";
}

// ═══════════════════════════════════════════════════════════════════
// TOKEN HELPERS
// ═══════════════════════════════════════════════════════════════════

export const tokenStorage = {
  getToken: (): string | null => localStorage.getItem("token"),
  
  setToken: (token: string): void => localStorage.setItem("token", token),
  
  clearToken: (): void => localStorage.removeItem("token"),
  
  // Decode token to get role without API call
  getPayload: (): { sub: string; username: string; role: string } | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token. split(". ")[1]));
      return payload;
    } catch {
      return null;
    }
  },
  
  getRole: (): string | null => {
    const payload = tokenStorage.getPayload();
    return payload?. role || null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════════════

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthTokens> => {
    const formData = new FormData();
    formData.append("username", credentials.username);
    formData.append("password", credentials. password);

    const response = await api.post<AuthTokens>("/auth/login", formData, {
      headers:  { "Content-Type": "multipart/form-data" },
    });

    tokenStorage.setToken(response.data. access_token);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<UserProfile> => {
    const response = await api.post<UserProfile>("/auth/register", data);
    return response.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>("/auth/me");
    return response.data;
  },

  logout: (): void => {
    tokenStorage.clearToken();
  },

  isAuthenticated: (): boolean => {
    return !!tokenStorage.getToken();
  },
};

export default authApi;