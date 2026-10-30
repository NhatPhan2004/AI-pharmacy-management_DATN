// apps/client/src/features/dashboard/DashboardRouter.tsx
import React from "react";
import { useAuth } from "../auth/hooks/useAuth";
import { RoleType } from "@pharmacy/shared";
import { AdminDashboard } from "./components/AdminDashboard";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { StaffDashboard } from "./components/StaffDashboard";

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case RoleType.ADMIN:
      return <AdminDashboard />;
    case RoleType.MANAGER:
      return <ManagerDashboard />;
    case RoleType.STAFF:
      return <StaffDashboard />;
    default:
      return <div>You are not authorized to view this page</div>;
  }
};
