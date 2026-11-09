import React, { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "../api/auth.api";

export interface UserProfile {
  id: string | number;
  username: string;
  fullName?: string;
  role: UserRole;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    userData: UserProfile,
  ) => void;
  logout: () => void;
}

interface DecodedToken {
  exp?: number;
  [key: string]: unknown;
}

const isTokenActive = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (!decoded.exp) return true;
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("currentUser");

    if (!token || !isTokenActive(token) || !storedUser) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.clear();
      return null;
    }
  });

  const login = (
    accessToken: string,
    refreshToken: string,
    userData: UserProfile,
  ) => {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  const token = localStorage.getItem("accessToken");
  const isAuthenticated = !!user && isTokenActive(token);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
