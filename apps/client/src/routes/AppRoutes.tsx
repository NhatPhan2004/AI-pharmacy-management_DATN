import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardRouter } from "@/features/dashboard/DashboardRouter";
import { RoleType } from "@pharmacy/shared";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />

          <Route element={<ProtectedRoute allowedRoles={[RoleType.ADMIN]} />}>
            <Route
              path="/inventory"
              element={<div>Màn hình Quản lý Kho & Nhập Lô hàng</div>}
            />
            <Route
              path="/admin/pharmacy"
              element={<div>Màn hình Quản lý Danh mục Thuốc</div>}
            />
            <Route path="/admin/staff" element={<div>Quản lý Nhân sự</div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[RoleType.MANAGER]} />}>
            <Route
              path="/decision-ai"
              element={<div>Màn hình Duyệt Gợi ý Nhập Hàng AI</div>}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={[RoleType.ADMIN, RoleType.STAFF]} />
            }
          >
            <Route
              path="/pos"
              element={<div>Màn hình Bán Hàng POS (FEFO)</div>}
            />
            <Route path="/customers" element={<div>Quản lý Khách hàng</div>} />
          </Route>

          <Route
            path="/reports"
            element={<div>Báo cáo Doanh thu & Luân chuyển</div>}
          />
          <Route path="/settings" element={<div>Cài đặt hệ thống</div>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
