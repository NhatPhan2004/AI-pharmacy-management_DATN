import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar/Sidebar";
import styles from "./MainLayout.module.scss";

export const MainLayout: React.FC = () => {
  return (
    <div className={styles.appContainer}>
      <Sidebar />
      <main className={styles.contentArea}>
        <Outlet />
      </main>
    </div>
  );
};
