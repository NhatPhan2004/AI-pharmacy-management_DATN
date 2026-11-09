import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { jwtDecode } from "jwt-decode";

type UserRole = NonNullable<ReturnType<typeof useAuth>["user"]>["role"];

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

interface DecodedToken {
  exp?: number;
  [key: string]: unknown;
}

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("access_token");

  const tokenExpired = isTokenExpired(token);

  if (!isAuthenticated || !token || tokenExpired) {
    if (tokenExpired && token) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("currentUser");
      if (typeof logout === "function") {
        logout();
      }
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
