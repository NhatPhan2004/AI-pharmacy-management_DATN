import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Building2, Calendar, FileText, CheckCircle2 } from "lucide-react";
import styles from "./Modals.module.scss";

export interface IReceiptDetailData {
  receiptCode: string;
  createdAt: string;
  supplierName: string;
  invoiceNumber: string;
  creatorName: string;
  note?: string;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    batchNumber: string;
    expiryDate: string;
    unitName: string;
    quantity: number;
    baseUnit: string;
    baseQuantity: number;
    costPrice: number;
    lineTotal: number;
  }>;
  totalAmount: number;
}

interface Props {
  data: IReceiptDetailData | null;
  onClose: () => void;
}

export const ReceiptDetailModal: React.FC<Props> = ({ data, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (data) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [data, onClose]);

  if (!data) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.receiptModalCard}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${styles.modalHeader} ${styles.receiptModalHeader}`}>
          <div>
            <div className={styles.headerTitleRow}>
              <h3 className={styles.modalTitle}>Chi Tiết Phiếu Nhập Kho</h3>
              <span className={styles.receiptCodeBadge}>
                {data.receiptCode}
              </span>
            </div>
            <p className={styles.modalSubtitle}>
              Ngày tạo: {data.createdAt} • Người lập:{" "}
              <strong>{data.creatorName}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.receiptMetaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>
              <Building2 size={15} /> Nhà Cung Cấp
            </span>
            <strong className={styles.metaValue}>{data.supplierName}</strong>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>
              <FileText size={15} /> Số Hóa Đơn VAT
            </span>
            <strong className={`${styles.metaValue} ${styles.code}`}>
              {data.invoiceNumber || "Không có"}
            </strong>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>
              <CheckCircle2 size={15} color="#15803d" /> Trạng Thái
            </span>
            <span className={styles.statusSuccessBadge}>
              Đã Nhập Kho Thực Tế
            </span>
          </div>
        </div>

        {data.note && (
          <p className={styles.receiptNoteText}>📝 Ghi chú: {data.note}</p>
        )}

        <div className={styles.receiptTableContainer}>
          <table className={styles.receiptDetailTable}>
            <thead>
              <tr>
                <th>Tên Dược Phẩm</th>
                <th>Số Lô (Batch)</th>
                <th>Hạn Dùng (HSD)</th>
                <th className={styles.alignRight}>SL Nhập</th>
                <th className={styles.alignRight}>Quy Đổi Base</th>
                <th className={styles.alignRight}>Đơn Giá</th>
                <th className={styles.alignRight}>Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.prodTitle}>{item.productName}</div>
                    <div className={styles.prodSku}>{item.sku}</div>
                  </td>
                  <td className={styles.colBatch}>{item.batchNumber}</td>
                  <td>
                    <span className={styles.dateBadge}>
                      <Calendar size={13} color="#64748b" />
                      {item.expiryDate}
                    </span>
                  </td>
                  <td className={styles.alignRight}>
                    {item.quantity} {item.unitName}
                  </td>
                  <td className={`${styles.alignRight} ${styles.colBaseQty}`}>
                    +{item.baseQuantity.toLocaleString("vi-VN")} {item.baseUnit}
                  </td>
                  <td className={styles.alignRight}>
                    {item.costPrice.toLocaleString("vi-VN")} đ
                  </td>
                  <td className={`${styles.alignRight} ${styles.colTotal}`}>
                    {item.lineTotal.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.receiptSummaryRow}>
          <span className={styles.totalItemsText}>
            Tổng số mặt hàng: <strong>{data.items.length} loại thuốc</strong>
          </span>
          <div className={styles.totalPaymentGroup}>
            <span>Tổng thanh toán:</span>
            <strong>{data.totalAmount.toLocaleString("vi-VN")} đ</strong>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
