// apps/client/src/features/dashboard/DashboardRouter.tsx
import React from "react";
import { useAuth } from "../auth/hooks/useAuth";
import { RoleType } from "@pharmacy/shared";
import { AdminDashboardPage } from "../dashboard/AdminDashboardPage";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { StaffDashboard } from "./components/StaffDashboard";

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case RoleType.ADMIN:
      return <AdminDashboardPage userName={user?.fullName} />;
    case RoleType.MANAGER:
      return <ManagerDashboard />;
    case RoleType.STAFF:
      return <StaffDashboard />;
    default:
      return <div>You are not authorized to view this page</div>;
  }
};
