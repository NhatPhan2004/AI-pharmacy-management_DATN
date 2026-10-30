import { RoleType } from "@pharmacy/shared";
import {
  LayoutDashboard,
  Building2,
  Package,
  ShoppingCart,
  Users,
  UserCheck,
  BrainCircuit,
  BarChart3,
  Settings,
  User,
} from "lucide-react";
import type React from "react";

export interface NavItemConfig {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: RoleType[];
}

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  {
    key: "overview",
    label: "Tổng quan",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [RoleType.ADMIN, RoleType.MANAGER, RoleType.STAFF],
  },
  {
    key: "pharmacy-mgmt",
    label: "Quản lý nhà thuốc",
    path: "/admin/pharmacy",
    icon: Building2,
    roles: [RoleType.ADMIN, RoleType.STAFF],
  },
  {
    key: "inventory",
    label: "Kho hàng",
    path: "/inventory",
    icon: Package,
    roles: [RoleType.ADMIN],
  },
  {
    key: "pos",
    label: "Bán hàng",
    path: "/pos",
    icon: ShoppingCart,
    roles: [RoleType.ADMIN, RoleType.STAFF],
  },
  {
    key: "customers",
    label: "Khách hàng",
    path: "/customers",
    icon: Users,
    roles: [RoleType.ADMIN, RoleType.STAFF],
  },
  {
    key: "staff",
    label: "Nhân viên",
    path: "/admin/staff",
    icon: UserCheck,
    roles: [RoleType.ADMIN],
  },
  {
    key: "decision-ai",
    label: "Hỗ trợ quyết định",
    path: "/decision-ai",
    icon: BrainCircuit,
    roles: [RoleType.MANAGER],
  },
  {
    key: "ai-analytics",
    label: "Phân tích AI",
    path: "/analytics/ai",
    icon: BrainCircuit,
    roles: [RoleType.ADMIN],
  },
  {
    key: "reports",
    label: "Báo cáo",
    path: "/reports",
    icon: BarChart3,
    roles: [RoleType.ADMIN, RoleType.MANAGER],
  },
  {
    key: "account",
    label: "Tài khoản",
    path: "/profile",
    icon: User,
    roles: [RoleType.STAFF],
  },
  {
    key: "settings",
    label: "Cài đặt",
    path: "/settings",
    icon: Settings,
    roles: [RoleType.ADMIN, RoleType.MANAGER],
  },
];
