import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Package,
  AlertTriangle,
  AlertOctagon,
  Layers,
  Edit2,
  Trash2,
} from "lucide-react";
import type { IPharmacyOverviewResponse, IProductItem } from "@pharmacy/shared";
import { pharmacyApi } from "../api/pharmacy.api";
import { BatchListModal } from "../components/BatchListModal";
import { CreateProductModal } from "../components/CreateProductModal";
import { EditProductModal } from "../components/EditProductModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import styles from "./PharmacyManagement.module.scss";

const CATEGORY_TABS = [
  { id: "", label: "Tất cả danh mục" },
  { id: "1", label: "Hạ sốt, giảm đau" },
  { id: "2", label: "Kháng sinh" },
  { id: "3", label: "Tim mạch" },
  { id: "4", label: "Vitamin & TPCN" },
];

export const PharmacyManagementPage: React.FC = () => {
  const [data, setData] = useState<IPharmacyOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [batchModalProduct, setBatchModalProduct] =
    useState<IProductItem | null>(null);
  const [editModalProduct, setEditModalProduct] = useState<IProductItem | null>(
    null,
  );
  const [deleteModalProduct, setDeleteModalProduct] =
    useState<IProductItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pharmacyApi.getOverview(
        searchTerm.trim() || undefined,
        selectedCategoryId || undefined,
      );
      setData(res);
    } catch (error) {
      console.error("Lỗi tải danh mục thuốc:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoryId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      void fetchOverview();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchOverview]);

  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    try {
      setIsDeleting(true);
      await pharmacyApi.deleteProduct(deleteModalProduct.id);
      setDeleteModalProduct(null);
      void fetchOverview();
    } catch (error) {
      console.error("Lỗi xóa thuốc:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockStatusBadge = (product: IProductItem) => {
    const qty = product.totalQuantityBase ?? 0;
    const threshold = product.safetyStockThreshold || 20;

    if (qty <= 0) {
      return (
        <span className={`${styles.badge} ${styles.badgeDanger}`}>
          Hết hàng
        </span>
      );
    }
    if (qty <= threshold) {
      return (
        <span className={`${styles.badge} ${styles.badgeWarning}`}>
          Sắp hết hàng
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.badgeSuccess}`}>
        Đủ tồn kho
      </span>
    );
  };

  const metrics = data?.metrics || {
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    nearExpiryCount: 0,
  };

  const products: IProductItem[] = data?.items || [];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Quản Lý Danh Mục Thuốc</h1>
        <p className={styles.subtitle}>
          Theo dõi danh mục dược phẩm, hệ số quy đổi đơn vị và cảnh báo tồn kho
          FEFO
        </p>
      </div>

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

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchForm}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm theo tên thuốc, mã SKU, hoạt chất..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void fetchOverview()}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={15} /> Làm mới
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} /> Thêm thuốc mới
            </button>
          </div>
        </div>

        <div className={styles.categoryTabs}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabItem} ${
                selectedCategoryId === tab.id ? styles.tabActive : ""
              }`}
              onClick={() => setSelectedCategoryId(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dược Phẩm & Hoạt Chất</th>
                <th>Danh Mục</th>
                <th>Tổng Tồn Kho (Base)</th>
                <th>Giá Bán Lẻ</th>
                <th>Trạng Thái</th>
                <th className={styles.textCenter}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.textCenter}>
                    Đang nạp dữ liệu thuốc từ hệ thống...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.textCenter}>
                    Không tìm thấy thuốc nào trong danh mục.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.drugCell}>
                        <span className={styles.drugName}>{item.name}</span>
                        <div className={styles.metaRow}>
                          <span className={styles.skuText}>{item.sku}</span>
                          {item.usageInstructions && (
                            <span className={styles.activeText}>
                              {item.usageInstructions}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {item.categoryName || "Chung"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.stockHighlight}>
                        {(item.totalQuantityBase ?? 0).toLocaleString("vi-VN")}
                      </span>
                      <span className={styles.stockSub}>
                        {item.baseUnitName}
                      </span>
                    </td>
                    <td>
                      <span className={styles.stockHighlight}>
                        {(item.minPrice || 0).toLocaleString("vi-VN")} đ
                      </span>
                    </td>
                    <td>{getStockStatusBadge(item)}</td>
                    <td className={styles.textCenter}>
                      <div className={styles.actionButtons}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Xem chi tiết các lô hạn dùng (FEFO)"
                          onClick={() => setBatchModalProduct(item)}
                        >
                          <Layers size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Chỉnh sửa thông tin thuốc & đơn vị"
                          onClick={() => setEditModalProduct(item)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.btnDanger}`}
                          title="Xóa thuốc"
                          onClick={() => setDeleteModalProduct(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BatchListModal
        product={batchModalProduct}
        onClose={() => setBatchModalProduct(null)}
      />

      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          void fetchOverview();
        }}
      />

      <EditProductModal
        product={editModalProduct}
        onClose={() => setEditModalProduct(null)}
        onSuccess={() => {
          setEditModalProduct(null);
          void fetchOverview();
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteModalProduct}
        drugName={deleteModalProduct?.name || ""}
        sku={deleteModalProduct?.sku || ""}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalProduct(null)}
      />
    </div>
  );
};
