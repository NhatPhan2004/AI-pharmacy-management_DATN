import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { pharmacyApi } from "../api/pharmacy.api";
import styles from "./Modals.module.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
export interface CreateProductPayload {
  sku: string;
  name: string;
  categoryId: string;
  safetyStockThreshold: number;
  usageInstructions?: string;
  units: {
    unitName: string;
    conversionToBase: number;
    sellingPrice: number;
    isBaseUnit: boolean;
  }[];
}

export const CreateProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("1");
  const [safetyThreshold, setSafetyThreshold] = useState(20);
  const [usageInstructions, setUsageInstructions] = useState("");
  const [units, setUnits] = useState([
    {
      unitName: "Viên",
      conversionToBase: 1,
      sellingPrice: 2000,
      isBaseUnit: true,
    },
    {
      unitName: "Hộp",
      conversionToBase: 100,
      sellingPrice: 180000,
      isBaseUnit: false,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddUnit = () => {
    setUnits([
      ...units,
      {
        unitName: "",
        conversionToBase: 10,
        sellingPrice: 0,
        isBaseUnit: false,
      },
    ]);
  };

  const handleRemoveUnit = (index: number) => {
    if (units[index].isBaseUnit) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: CreateProductPayload = {
        sku: sku.trim(),
        name: name.trim(),
        categoryId,
        safetyStockThreshold: Number(safetyThreshold),
        usageInstructions: usageInstructions.trim() || undefined,
        units: units.map((u) => ({
          unitName: u.unitName.trim(),
          conversionToBase: Number(u.conversionToBase),
          sellingPrice: Number(u.sellingPrice),
          isBaseUnit: Boolean(u.isBaseUnit),
        })),
      };

      await pharmacyApi.createProduct(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError<{ message?: string | string[] }>(err)) {
        const msg = err.response?.data?.message;
        setErrorMsg(
          Array.isArray(msg)
            ? msg.join(", ")
            : msg || "Không thể tạo mới thuốc.",
        );
      } else {
        setErrorMsg("Đã xảy ra lỗi khi tạo sản phẩm.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Thêm Mới Thuốc & Đơn Vị Quy Đổi</h3>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.formBody}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Mã SKU / Mã Vạch *</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="VD: MED-PARA-500"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tên Thuốc *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Paracetamol 500mg"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Danh mục</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={styles.selectInput}
              >
                <option value="1">Hạ sốt, giảm đau</option>
                <option value="2">Kháng sinh</option>
                <option value="3">Tim mạch</option>
                <option value="4">Vitamin & TPCN</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Ngưỡng Báo Thiếu Hàng</label>
              <input
                type="number"
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Hướng dẫn sử dụng</label>
            <input
              value={usageInstructions}
              onChange={(e) => setUsageInstructions(e.target.value)}
              placeholder="VD: Uống sau bữa ăn, 1-2 viên/lần"
            />
          </div>

          <div className={styles.unitSection}>
            <div className={styles.unitHeader}>
              <label>Quy cách đóng gói & Đơn vị bán lẻ</label>
              <button
                type="button"
                onClick={handleAddUnit}
                className={styles.addUnitBtn}
              >
                <Plus size={14} /> Thêm cấp đơn vị
              </button>
            </div>

            {units.map((unit, idx) => (
              <div key={idx} className={styles.unitRow}>
                <div className={styles.inputWrapper}>
                  <datalist id="common-units">
                    <option value="Viên" />
                    <option value="Vỉ" />
                    <option value="Hộp" />
                    <option value="Gói" />
                    <option value="Ống" />
                    <option value="Chai" />
                    <option value="Lọ" />
                    <option value="Tuýp" />
                    <option value="Thùng" />
                  </datalist>

                  <input
                    list="common-units"
                    placeholder="VD: Viên, Vỉ, Hộp..."
                    value={unit.unitName}
                    onChange={(e) => {
                      const next = [...units];
                      next[idx].unitName = e.target.value;
                      setUnits(next);
                    }}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Hệ số"
                    disabled={unit.isBaseUnit}
                    value={unit.isBaseUnit ? 1 : unit.conversionToBase}
                    onChange={(e) => {
                      const next = [...units];
                      next[idx].conversionToBase = Number(e.target.value);
                      setUnits(next);
                    }}
                    required
                    className={`${styles.formInput} ${unit.isBaseUnit ? styles.disabledInput : ""}`}
                  />
                </div>

                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="Giá bán"
                    value={unit.sellingPrice}
                    onChange={(e) => {
                      const next = [...units];
                      next[idx].sellingPrice = Number(e.target.value);
                      setUnits(next);
                    }}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.tagWrapper}>
                  <span
                    className={
                      unit.isBaseUnit ? styles.baseTag : styles.convertTag
                    }
                  >
                    {unit.isBaseUnit ? "Đơn vị gốc" : "Quy đổi"}
                  </span>
                </div>

                <div className={styles.actionWrapper}>
                  {!unit.isBaseUnit && (
                    <button
                      type="button"
                      title="Xóa cấp này"
                      onClick={() => handleRemoveUnit(idx)}
                      className={styles.deleteUnitBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className={styles.unitHintBox}>
              💡 <strong>Ví dụ thực tế:</strong> 1{" "}
              {units[0]?.unitName || "Viên"} = 1 (Gốc) | 1 Vỉ = 10{" "}
              {units[0]?.unitName || "Viên"} | 1 Hộp = 100{" "}
              {units[0]?.unitName || "Viên"}. Khi nhập 1 Hộp, kho sẽ tự cộng
              thêm 100 {units[0]?.unitName || "Viên"}.
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.btnSubmit}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu Thuốc Vào Kho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
