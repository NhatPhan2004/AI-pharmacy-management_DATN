import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Building2, Save } from "lucide-react";
import styles from "./Modals.module.scss";
import type { ISupplierItem, ISupplierPayload } from "../api/inventory.api";

interface Props {
  isOpen: boolean;
  initialData?: ISupplierItem | null;
  onClose: () => void;
  onSubmit: (payload: ISupplierPayload, editId?: string) => Promise<void>;
}

interface InnerFormProps {
  initialData?: ISupplierItem | null;
  onClose: () => void;
  onSubmit: (payload: ISupplierPayload, editId?: string) => Promise<void>;
}

const SupplierFormContent: React.FC<InnerFormProps> = ({
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialData?.name ?? "");
  const [taxCode, setTaxCode] = useState(initialData?.taxCode ?? "");
  const [contactPerson, setContactPerson] = useState(
    initialData?.contactPerson ?? "",
  );
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [saving, setSaving] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên Công ty Dược / Nhà cung cấp.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit(
        {
          name: name.trim(),
          taxCode: taxCode.trim() || undefined,
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        },
        initialData?.id,
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(
        error.response?.data?.message ||
          "Không thể lưu thông tin nhà cung cấp.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.supplierForm}>
      <div className={styles.formField}>
        <label>
          Tên Công Ty Dược / Nhà Cung Cấp{" "}
          <span className={styles.requiredMark}>*</span>
        </label>
        <input
          type="text"
          placeholder="VD: Công ty Cổ phần Dược phẩm Imexpharm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className={styles.formRowTwoCol}>
        <div className={styles.formField}>
          <label>Mã Số Thuế (MST)</label>
          <input
            type="text"
            placeholder="VD: 1400116448"
            value={taxCode}
            onChange={(e) => setTaxCode(e.target.value)}
            className={styles.monoInput}
          />
        </div>

        <div className={styles.formField}>
          <label>Số Điện Thoại Liên Hệ</label>
          <input
            type="tel"
            placeholder="VD: 0277 3851 941"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formRowTwoCol}>
        <div className={styles.formField}>
          <label>Trình Dược Viên / Đầu Mối</label>
          <input
            type="text"
            placeholder="VD: Nguyễn Văn An"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
        </div>

        <div className={styles.formField}>
          <label>Email Nhận Đơn Hàng</label>
          <input
            type="email"
            placeholder="VD: sales@imexpharm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formField}>
        <label>Địa Chỉ Trụ Sở / Kho Phân Phối</label>
        <input
          type="text"
          placeholder="VD: Số 04 Đường 30/4, Phường 1, TP. Cao Lãnh, Đồng Tháp"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className={`${styles.modalFooter} ${styles.supplierModalFooter}`}>
        <button type="button" onClick={onClose} className={styles.btnCancel}>
          Hủy
        </button>
        <button
          type="submit"
          disabled={saving}
          className={styles.btnSaveSupplier}
        >
          <Save size={15} />
          {saving
            ? "Đang lưu..."
            : initialData
              ? "Cập Nhật"
              : "Lưu Nhà Cung Cấp"}
        </button>
      </div>
    </form>
  );
};

export const SupplierFormModal: React.FC<Props> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.supplierFormCard}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.supplierHeaderTitle}>
            <Building2 size={22} color="#073b3a" />
            <div>
              <h3 className={styles.modalTitle}>
                {initialData
                  ? "Cập Nhật Nhà Cung Cấp"
                  : "Thêm Nhà Cung Cấp Dược Phẩm"}
              </h3>
              <p className={styles.modalSubtitle}>
                Quản lý thông tin pháp nhân, mã số thuế và đầu mối đặt hàng
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <SupplierFormContent
          key={initialData?.id ?? "new"}
          initialData={initialData}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>,
    document.body,
  );
};
