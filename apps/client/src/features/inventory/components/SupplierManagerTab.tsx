import React, { useState } from "react";
import { Plus, Search, Edit3, Trash2, Phone, MapPin } from "lucide-react";
import styles from "../page/InventoryWarehousePage.module.scss";
import type { IPurchaseOrderRow, ISupplierItem } from "../api/inventory.api";

interface Props {
  suppliers: ISupplierItem[];
  receiptHistory: IPurchaseOrderRow[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (supplier: ISupplierItem) => void;
  onDelete: (supplier: ISupplierItem) => void;
}

export const SupplierManagerTab: React.FC<Props> = ({
  suppliers,
  receiptHistory,
  isAdmin,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [search, setSearch] = useState("");

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.taxCode && s.taxCode.includes(search)) ||
      (s.phone && s.phone.includes(search)),
  );

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <input
            placeholder="Tìm theo tên công ty dược, mã số thuế, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button
            type="button"
            className={styles.btnCreateReceipt}
            onClick={onAdd}
          >
            <Plus size={16} /> Thêm Nhà Cung Cấp
          </button>
        )}
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Công Ty Dược / Nhà Cung Cấp</th>
              <th>Liên Hệ & Đầu Mối</th>
              <th>Địa Chỉ</th>
              <th>Tổng Giá Trị Nhập</th>
              <th>Trạng Thái</th>
              {isAdmin && <th className={styles.colCenter}>Thao Tác</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  className={`${styles.tableStatusMessage} ${styles.muted}`}
                >
                  Chưa có nhà cung cấp nào phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map((sup) => {
                const totalImport = receiptHistory
                  .filter((r) => r.supplierName === sup.name)
                  .reduce((sum, r) => sum + Number(r.totalCost || 0), 0);

                return (
                  <tr key={sup.id}>
                    <td>
                      <div className={styles.supplierNameCell}>
                        <strong>{sup.name}</strong>
                        <span>MST: {sup.taxCode || "Chưa cập nhật"}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactCell}>
                        <span className={styles.contactPersonName}>
                          {sup.contactPerson || "Phòng Kinh Doanh"}
                        </span>
                        <span className={styles.contactPhoneLine}>
                          <Phone size={11} />
                          {sup.phone || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.addressCell}>
                        <MapPin size={12} color="#94a3b8" />
                        {sup.address || "—"}
                      </span>
                    </td>
                    <td className={styles.priceHighlight}>
                      {totalImport.toLocaleString("vi-VN")} đ
                    </td>
                    <td>
                      <span className={styles.statusCompleteBadge}>
                        Đang hợp tác
                      </span>
                    </td>
                    {isAdmin && (
                      <td className={styles.colCenter}>
                        <div className={styles.actionBtnGroup}>
                          <button
                            type="button"
                            title="Chỉnh sửa thông tin"
                            className={styles.btnEditAction}
                            onClick={() => onEdit(sup)}
                          >
                            <Edit3 size={13} /> Sửa
                          </button>
                          <button
                            type="button"
                            title="Ngừng hợp tác"
                            className={styles.btnDeleteAction}
                            onClick={() => onDelete(sup)}
                          >
                            <Trash2 size={13} /> Ngừng
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
