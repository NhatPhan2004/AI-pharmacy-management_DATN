import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { NAVIGATION_ITEMS } from "../navigation.config";
import type { NavItemConfig } from "../navigation.config";
import { useAuth } from "@/features/auth/hooks/useAuth";
import styles from "./Sidebar.module.scss";

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const allowedNavItems: NavItemConfig[] = user?.role
    ? NAVIGATION_ITEMS.filter((item) =>
        item.roles.some(
          (role) =>
            String(role).toLowerCase() === String(user.role).toLowerCase(),
        ),
      )
    : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h2>PharmAI</h2>
      </div>

      <nav className={styles.navMenu}>
        <ul className={styles.navList}>
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ""}`
                  }
                >
                  <Icon size={18} className={styles.icon} />
                  <span className={styles.label}>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
