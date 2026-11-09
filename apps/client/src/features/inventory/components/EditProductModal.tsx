import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { IProductItem } from "@pharmacy/shared";
import { pharmacyApi } from "../api/pharmacy.api";
import styles from "./Modals.module.scss";

interface Props {
  product: IProductItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface IProductUnitFormItem {
  id?: string;
  unitName: string;
  conversionToBase: number;
  sellingPrice: number;
  isBaseUnit: boolean;
}

const EditForm: React.FC<{
  product: IProductItem;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ product, onClose, onSuccess }) => {
  const [name, setName] = useState(product.name);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [safetyThreshold, setSafetyThreshold] = useState(
    product.safetyStockThreshold || 20,
  );
  const [usageInstructions, setUsageInstructions] = useState(
    product.usageInstructions || "",
  );
  const [units, setUnits] = useState<IProductUnitFormItem[]>(
    product.units && product.units.length > 0
      ? product.units
      : [
          {
            unitName: product.baseUnitName || "Viên",
            conversionToBase: 1,
            sellingPrice: product.minPrice || 0,
            isBaseUnit: true,
          },
        ],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddUnit = () => {
    setUnits((prev) => [
      ...prev,
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
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await pharmacyApi.updateProduct(product.id, {
        name,
        categoryId,
        safetyStockThreshold: Number(safetyThreshold),
        usageInstructions,
        units: units.map((u) => ({
          id: u.id,
          unitName: u.unitName,
          conversionToBase: Number(u.conversionToBase),
          sellingPrice: Number(u.sellingPrice),
          isBaseUnit: Boolean(u.isBaseUnit),
        })),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || "Cập nhật thuốc thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <div>
          <h3 className={styles.modalTitle}>Cập Nhật Thông Tin Dược Phẩm</h3>
          <p className={styles.modalSubtitle}>
            SKU: <strong>{product.sku}</strong>
          </p>
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn}>
          <X size={20} />
        </button>
      </div>

      {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

      <form onSubmit={handleSubmit} className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tên Thuốc Thương Mại</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.formInput}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Danh Mục</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={styles.formSelect}
            >
              <option value="1">Hạ sốt, giảm đau</option>
              <option value="2">Kháng sinh</option>
              <option value="3">Tim mạch</option>
              <option value="4">Vitamin & TPCN</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ngưỡng Báo Thiếu Hàng</label>
            <input
              type="number"
              min="0"
              value={safetyThreshold}
              onChange={(e) => setSafetyThreshold(Number(e.target.value))}
              className={styles.formInput}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Hướng Dẫn & Hoạt Chất</label>
          <input
            value={usageInstructions}
            onChange={(e) => setUsageInstructions(e.target.value)}
            className={styles.formInput}
          />
        </div>

        <div className={styles.unitSection}>
          <div className={styles.unitHeader}>
            <div>
              <span className={styles.unitSectionTitle}>
                Cấp Đơn Vị & Bảng Giá Niêm Yết
              </span>
              <span className={styles.unitSectionSub}>
                Hệ thống theo dõi tồn kho theo đơn vị nhỏ nhất (Base Unit)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddUnit}
              className={styles.addUnitBtn}
            >
              <Plus size={14} /> Thêm cấp
            </button>
          </div>

          <div className={styles.unitTableHead}>
            <span>Tên đơn vị</span>
            <span>Hệ số quy đổi</span>
            <span>Giá bán lẻ (đ)</span>
            <span style={{ textAlign: "center" }}>Loại đơn vị</span>
            <span></span>
          </div>

          <datalist id="edit-common-units">
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

          <div className={styles.unitList}>
            {units.map((unit, idx) => (
              <div key={idx} className={styles.unitRow}>
                <div className={styles.inputWrapper}>
                  <input
                    list="edit-common-units"
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
                    placeholder="Giá bán lẻ"
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
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.btnSubmit}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export const EditProductModal: React.FC<Props> = ({
  product,
  onClose,
  onSuccess,
}) => {
  if (!product) return null;

  return (
    <div className={styles.modalOverlay}>
      <EditForm
        key={product.id}
        product={product}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
};
