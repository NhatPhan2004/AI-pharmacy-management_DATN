// apps/client/src/features/dashboard/components/AdminDashboard.tsx
import React from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, color: "#1b3a37", margin: 0 }}>
          Tổng quan Quản trị (Admin)
        </h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>
          Xin chào, {user?.fullName}. Toàn bộ hệ thống danh mục, nhân sự và tồn
          kho đang hoạt động ổn định.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ color: "#64748b", fontSize: 13 }}>Danh mục thuốc</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1b3a37",
              marginTop: 6,
            }}
          >
            1.240
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ color: "#64748b", fontSize: 13 }}>Lô hàng tồn kho</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1b3a37",
              marginTop: 6,
            }}
          >
            3.450
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ color: "#e53e3e", fontSize: 13 }}>
            Lô cận hạn (&lt; 90 ngày)
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#e53e3e",
              marginTop: 6,
            }}
          >
            18
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ color: "#d97706", fontSize: 13 }}>
            Chạm ngưỡng tồn an toàn
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#d97706",
              marginTop: 6,
            }}
          >
            7
          </div>
        </div>
      </div>
    </div>
  );
};
