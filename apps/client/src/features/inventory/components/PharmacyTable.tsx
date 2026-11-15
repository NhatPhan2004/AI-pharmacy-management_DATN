import React from "react";
import { Layers, Edit2, Trash2 } from "lucide-react";
import type { IProductItem } from "@pharmacy/shared";
import styles from "../page/PharmacyManagement.module.scss";

interface Props {
  products: IProductItem[];
  loading: boolean;
  onOpenBatch: (product: IProductItem) => void;
  onOpenEdit: (product: IProductItem) => void;
  onOpenDelete: (product: IProductItem) => void;
}

export const PharmacyTable: React.FC<Props> = ({
  products,
  loading,
  onOpenBatch,
  onOpenEdit,
  onOpenDelete,
}) => {
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

  return (
    <div className={styles.tableResponsive}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Dược Phẩm / Sản Phẩm</th>
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
                  <span className={styles.stockSub}>{item.baseUnitName}</span>
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
                      title="Xem chi tiết mô tả & các lô hạn dùng (FEFO)"
                      onClick={() => onOpenBatch(item)}
                    >
                      <Layers size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Chỉnh sửa thông tin thuốc & đơn vị"
                      onClick={() => onOpenEdit(item)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.btnDanger}`}
                      title="Xóa thuốc"
                      onClick={() => onOpenDelete(item)}
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
  );
};
