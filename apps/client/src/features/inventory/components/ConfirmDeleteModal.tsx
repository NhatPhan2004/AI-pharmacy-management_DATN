import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import styles from "./Modals.module.scss";

interface Props {
  isOpen: boolean;
  title?: string;
  drugName: string;
  sku: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<Props> = ({
  isOpen,
  title = "Xác nhận xóa dược phẩm",
  drugName,
  sku,
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={!isDeleting ? onClose : undefined}
    >
      <div
        className={`${styles.modalContent} ${styles.deleteDialogCard}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className={styles.dialogCloseBtn}
        >
          <X size={18} />
        </button>

        <div className={styles.deleteDialogBody}>
          <div className={styles.warningIconBadge}>
            <AlertTriangle size={28} />
          </div>

          <h3 className={styles.dialogTitle}>{title}</h3>

          <p className={styles.dialogDescription}>
            Bạn có chắc chắn muốn xóa thuốc{" "}
            <span className={styles.highlightText}>{drugName}</span> (Mã SKU:{" "}
            <span className={styles.skuTag}>{sku}</span>) khỏi danh mục hoạt
            động?
          </p>

          <div className={styles.noteBox}>
            ℹ️ <strong>Lưu ý:</strong> Hệ thống áp dụng <em>Soft-delete</em>.
            Thuốc sẽ bị ẩn khỏi màn hình POS và danh mục bán, nhưng toàn bộ lịch
            sử hóa đơn và các lô tồn kho cũ vẫn được lưu trữ bảo toàn.
          </div>
        </div>

        <div className={styles.dialogActionRow}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={styles.dialogBtnCancel}
          >
            Hủy thao tác
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={styles.dialogBtnDanger}
          >
            {isDeleting ? "Đang xóa..." : "Đồng ý xóa"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
