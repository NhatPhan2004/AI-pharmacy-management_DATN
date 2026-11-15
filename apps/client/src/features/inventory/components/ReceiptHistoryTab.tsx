import React, { useState } from "react";
import { Plus, Search, Eye } from "lucide-react";
import styles from "../page/InventoryWarehousePage.module.scss";
import type { IPurchaseOrderRow } from "../api/inventory.api";

interface Props {
  receiptHistory: IPurchaseOrderRow[];
  loading: boolean;
  isAdmin: boolean;
  onCreateNew: () => void;
  onViewDetail: (id: string) => void;
}

export const ReceiptHistoryTab: React.FC<Props> = ({
  receiptHistory,
  loading,
  isAdmin,
  onCreateNew,
  onViewDetail,
}) => {
  const [search, setSearch] = useState("");

  const filtered = receiptHistory.filter(
    (r) =>
      r.poCode.toLowerCase().includes(search.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <input
            placeholder="Tìm theo mã phiếu PO, tên nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button
            type="button"
            className={styles.btnCreateReceipt}
            onClick={onCreateNew}
          >
            <Plus size={16} /> Lập Phiếu Nhập Mới
          </button>
        )}
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã Phiếu</th>
              <th>Ngày Nhập</th>
              <th>Nhà Cung Cấp</th>
              <th>Số Mặt Hàng</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
              <th className={styles.colCenter}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.tableStatusMessage}>
                  Đang đồng bộ dữ liệu phiếu nhập từ máy chủ...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className={`${styles.tableStatusMessage} ${styles.muted}`}
                >
                  Chưa có phiếu nhập kho nào phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map((receipt) => (
                <tr key={receipt.id}>
                  <td className={styles.receiptCodeCell}>{receipt.poCode}</td>
                  <td>{new Date(receipt.createdAt).toLocaleString("vi-VN")}</td>
                  <td>{receipt.supplierName}</td>
                  <td>{receipt.itemCount} Mặt hàng</td>
                  <td className={styles.priceHighlight}>
                    {Number(receipt.totalCost).toLocaleString("vi-VN")} đ
                  </td>
                  <td>
                    <span className={styles.statusCompleteBadge}>
                      {receipt.status}
                    </span>
                  </td>
                  <td className={styles.colCenter}>
                    <button
                      type="button"
                      title="Xem chi tiết phiếu nhập"
                      onClick={() => onViewDetail(receipt.id)}
                      className={styles.detailActionButton}
                    >
                      <Eye size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
