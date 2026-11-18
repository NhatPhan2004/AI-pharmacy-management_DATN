import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  PackagePlus,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Wallet,
  Boxes,
  AlertTriangle,
  Clock,
} from "lucide-react";
import styles from "./AdminDashboardPage.module.scss";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { Link } from "react-router-dom";

interface Props {
  userName?: string;
}

export const AdminDashboardPage: React.FC<Props> = ({ userName }) => {
  const navigate = useNavigate();
  const {
    isLoading,
    refresh,
    totalCapitalValue,
    totalActiveBatches,
    totalProducts,
    medicineCount,
    cosmeticCount,
    lowOrOutStockCount,
    nearExpiryCount,
    nearExpiryCapital,
    priorityRows,
    categoryCapitals,
    donutGradient,
    recentOrders,
  } = useAdminDashboard();

  const displayUserName =
    userName && userName.trim().length > 0 ? userName : "Quản trị viên";

  return (
    <div className={styles.pageContainer}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h1>Tổng quan Quản trị (Admin)</h1>
          <p>
            Xin chào, <strong>{displayUserName}</strong>. Toàn bộ danh mục
            thuốc, lô FEFO và chứng từ kho đang đồng bộ.
          </p>
        </div>

        <div className={styles.quickActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => void refresh()}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate("/admin/pharmacy")}
          >
            <Plus size={15} /> Thêm thuốc mới
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => navigate("/inventory")}
          >
            <PackagePlus size={15} /> Nhập kho lô FEFO
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Re-designed Layout */}
      <div className={styles.kpiGrid}>
        {/* Thẻ 1 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeaderTop}>
            <div className={`${styles.kpiIconBox} ${styles.teal}`}>
              <Wallet size={17} />
            </div>
            <span className={styles.kpiLabel}>TỔNG GIÁ TRỊ TỒN KHO</span>
          </div>
          <div className={`${styles.kpiValue} ${styles.kpiValueTeal}`}>
            {isLoading
              ? "..."
              : `${totalCapitalValue.toLocaleString("vi-VN")} đ`}
          </div>
          <div>
            <span className={styles.kpiPillGreen}>
              Đang lưu kho trên {totalActiveBatches} mặt hàng có tồn
            </span>
          </div>
        </div>

        {/* Thẻ 2 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeaderTop}>
            <div className={`${styles.kpiIconBox} ${styles.blue}`}>
              <Boxes size={17} />
            </div>
            <span className={styles.kpiLabel}>DANH MỤC ĐANG KINH DOANH</span>
          </div>
          <div className={styles.kpiValue}>
            {isLoading ? "..." : `${totalProducts} mặt hàng`}
          </div>
          <div>
            <span className={styles.kpiPillTeal}>
              {medicineCount} Thuốc • {cosmeticCount} Dược mỹ phẩm
            </span>
          </div>
        </div>

        {/* Thẻ 3 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeaderTop}>
            <div className={`${styles.kpiIconBox} ${styles.amber}`}>
              <AlertTriangle size={17} />
            </div>
            <span className={styles.kpiLabel}>SẮP HẾT / HẾT HÀNG</span>
          </div>
          <div className={`${styles.kpiValue} ${styles.kpiValueAmber}`}>
            {isLoading ? "..." : `${lowOrOutStockCount} mặt hàng`}
          </div>
          <div>
            <span className={styles.kpiPillAmber}>
              Chạm ngưỡng tồn kho an toàn
            </span>
          </div>
        </div>

        {/* Thẻ 4 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeaderTop}>
            <div className={`${styles.kpiIconBox} ${styles.red}`}>
              <Clock size={17} />
            </div>
            <span className={styles.kpiLabel}>LÔ CẬN HẠN (&lt; 90 NGÀY)</span>
          </div>
          <div className={`${styles.kpiValue} ${styles.kpiValueRed}`}>
            {isLoading ? "..." : `${nearExpiryCount} lô FEFO`}
          </div>
          <div>
            <span className={styles.kpiPillRed}>
              {nearExpiryCapital > 0
                ? `Trị giá ${nearExpiryCapital.toLocaleString("vi-VN")} đ cần xuất`
                : "Kiểm soát hạn dùng tự động"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.mainSplitGrid}>
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h2>Lô Thuốc Ưu Tiên Xuất Trước (FEFO) &amp; Cảnh Báo Tồn Kho</h2>
            <Link to="/admin/pharmacy" className={styles.linkBtn}>
              Xem danh mục thuốc{" "}
              <ArrowRight size={13} style={{ verticalAlign: "middle" }} />
            </Link>
          </div>

          {priorityRows.length === 0 ? (
            <div className={styles.emptyText}>
              {isLoading
                ? "Đang tải dữ liệu lô FEFO..."
                : "Kho hàng đang ở trạng thái an toàn, chưa có lô cận hạn."}
            </div>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Tên thuốc / Sản phẩm</th>
                  <th>Số lô / SKU</th>
                  <th>Hạn dùng</th>
                  <th>Tồn kho</th>
                  <th>Ưu tiên</th>
                </tr>
              </thead>
              <tbody>
                {priorityRows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.prodTitle}>{row.productName}</td>
                    <td className={styles.monoCode}>{row.batchNumber}</td>
                    <td>{row.expiryDate}</td>
                    <td>
                      <strong>
                        {row.quantityRemaining.toLocaleString("vi-VN")}
                      </strong>{" "}
                      {row.baseUnit}
                    </td>
                    <td>
                      <span
                        className={
                          row.statusTag === "NEAR_EXPIRY"
                            ? styles.badgeNearExpiry
                            : row.statusTag === "LOW_STOCK"
                              ? styles.badgeLowStock
                              : styles.badgeFefo
                        }
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h2>Cơ Cấu Vốn Tồn Kho Theo Danh Mục</h2>
          </div>

          {categoryCapitals.length === 0 ? (
            <div className={styles.emptyText}>
              Chưa có dữ liệu tồn kho theo danh mục
            </div>
          ) : (
            <div className={styles.donutWrapper}>
              <div
                className={styles.donutRing}
                style={{ background: donutGradient }}
              >
                <div className={styles.donutHole}>
                  <strong>
                    {totalCapitalValue >= 1_000_000
                      ? `${(totalCapitalValue / 1_000_000).toFixed(1)} Tr`
                      : `${Math.round(totalCapitalValue / 1_000)} K`}
                  </strong>
                  <span>Tổng vốn</span>
                </div>
              </div>

              <div className={styles.legendList}>
                {categoryCapitals.map((cat) => (
                  <div key={cat.categoryName} className={styles.legendItem}>
                    <div className={styles.legendLeft}>
                      <span
                        className={styles.legendDot}
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.categoryName}</span>
                    </div>
                    <strong>{cat.percentage}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainSplitGrid}>
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h2>Chứng Từ Nhập Kho Gần Đây (Purchase Orders)</h2>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => navigate("/inventory")}
            >
              Lịch sử nhập kho{" "}
              <ArrowRight size={13} style={{ verticalAlign: "middle" }} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className={styles.emptyText}>
              Chưa có phiếu nhập kho nào. Nhấn &ldquo;+ Nhập kho lô FEFO&rdquo;
              để bắt đầu.
            </div>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Mã chứng từ</th>
                  <th>Nhà cung cấp</th>
                  <th>Số dòng</th>
                  <th>Tổng tiền hàng</th>
                  <th>Ngày nhập</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((po) => (
                  <tr key={po.id}>
                    <td className={styles.monoCode}>{po.poCode}</td>
                    <td className={styles.prodTitle}>{po.supplierName}</td>
                    <td>{po.itemCount} lô</td>
                    <td style={{ color: "#059669", fontWeight: 700 }}>
                      {Number(po.totalCost || 0).toLocaleString("vi-VN")} đ
                    </td>
                    <td>
                      {new Date(po.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.aiPanel}>
          <div>
            <div className={styles.aiBadge}>
              <Sparkles size={13} /> AI DSS Insights
            </div>
            <h3 className={styles.aiTitle}>
              Khuyến Nghị Điều Hành Kho Thông Minh:
            </h3>
            <ul className={styles.aiList}>
              <li>
                {nearExpiryCount > 0
                  ? `Đang có ${nearExpiryCount} lô cận hạn (< 90 ngày) cần ưu tiên xuất trước tại quầy POS theo nguyên tắc FEFO.`
                  : "Tất cả các lô thuốc trong kho đều đang có hạn sử dụng an toàn (> 90 ngày)."}
              </li>
              <li>
                {lowOrOutStockCount > 0
                  ? `Phát hiện ${lowOrOutStockCount} mặt hàng chạm ngưỡng tồn an toàn — nên lập phiếu nhập bổ sung sớm.`
                  : "Mức tồn kho các mặt hàng thiết yếu đang ổn định trên ngưỡng an toàn."}
              </li>
            </ul>
          </div>

          <div className={styles.healthBox}>
            <h4>Trạng thái hạ tầng &amp; Module (Giai đoạn 4)</h4>
            <div className={styles.healthRow}>
              ● PostgreSQL &amp; TypeORM: Hoạt động ổn định
            </div>
            <div className={styles.healthRow}>
              ● FEFO Batch &amp; RBAC Guards: Đã kích hoạt
            </div>
            <div className={styles.healthRow}>
              ○ POS &amp; Time-series ROP Engine: Sẵn sàng Giai đoạn 5–8
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
