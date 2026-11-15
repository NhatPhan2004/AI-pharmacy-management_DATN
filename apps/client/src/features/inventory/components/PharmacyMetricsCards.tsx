import React from "react";
import { Package, AlertTriangle, AlertOctagon } from "lucide-react";
import styles from "../page/PharmacyManagement.module.scss";

interface Props {
  metrics: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    nearExpiryCount: number;
  };
}

export const PharmacyMetricsCards: React.FC<Props> = ({ metrics }) => {
  return (
    <div className={styles.metricGrid}>
      <div className={`${styles.metricCard} ${styles.cardPrimary}`}>
        <div className={styles.iconWrap}>
          <Package size={22} />
        </div>
        <div className={styles.metricInfo}>
          <span className={styles.metricLabel}>Dược phẩm hoạt động</span>
          <span className={styles.metricValue}>
            {metrics.totalProducts.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>

      <div className={`${styles.metricCard} ${styles.cardWarning}`}>
        <div className={styles.iconWrap}>
          <AlertTriangle size={22} />
        </div>
        <div className={styles.metricInfo}>
          <span className={styles.metricLabel}>Cảnh báo dưới ngưỡng</span>
          <span className={styles.metricValue}>
            {metrics.lowStockCount.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>

      <div className={`${styles.metricCard} ${styles.cardDanger}`}>
        <div className={styles.iconWrap}>
          <AlertOctagon size={22} />
        </div>
        <div className={styles.metricInfo}>
          <span className={styles.metricLabel}>Lô sắp / đã hết hạn</span>
          <span className={styles.metricValue}>
            {metrics.nearExpiryCount.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>
    </div>
  );
};
