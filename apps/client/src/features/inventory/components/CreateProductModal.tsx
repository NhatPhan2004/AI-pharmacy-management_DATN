import React, { useState, useEffect } from "react";
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

interface CategoryItem {
  id: string;
  name: string;
}

interface ExtendedPharmacyApi {
  getCategories?: () => Promise<CategoryItem[] | { data: CategoryItem[] }>;
  createProduct: (payload: CreateProductPayload) => Promise<unknown>;
}
const safePharmacyApi = pharmacyApi as unknown as ExtendedPharmacyApi;

const UNIT_PRESETS = {
  MEDICINE: [
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
  ],
  COSMETIC_BOTTLE: [
    {
      unitName: "Chai",
      conversionToBase: 1,
      sellingPrice: 150000,
      isBaseUnit: true,
    },
  ],
  COSMETIC_TUBE: [
    {
      unitName: "Tuýp",
      conversionToBase: 1,
      sellingPrice: 120000,
      isBaseUnit: true,
    },
  ],
};

interface InnerFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProductFormContent: React.FC<InnerFormProps> = ({
  onClose,
  onSuccess,
}) => {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [safetyThreshold, setSafetyThreshold] = useState(20);
  const [usageInstructions, setUsageInstructions] = useState("");
  const [units, setUnits] = useState(UNIT_PRESETS.MEDICINE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        let list: CategoryItem[] = [];

        if (typeof safePharmacyApi.getCategories === "function") {
          const res = await safePharmacyApi.getCategories();
          if (Array.isArray(res)) {
            list = res;
          } else if (res && Array.isArray(res.data)) {
            list = res.data;
          }
        } else {
          const res = await axios.get<CategoryItem[]>(
            "http://localhost:4000/api/v1/categories",
          );
          if (Array.isArray(res.data)) {
            list = res.data;
          }
        }

        if (isMounted && list.length > 0) {
          setCategories(list);
          setCategoryId(list[0].id);
        }
      } catch (err: unknown) {
        console.error("Không thể lấy danh mục thuốc:", err);
      }
    };

    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleSetBaseUnit = (targetIdx: number) => {
    setUnits(
      units.map((u, i) => ({
        ...u,
        isBaseUnit: i === targetIdx,
        conversionToBase: i === targetIdx ? 1 : u.conversionToBase,
      })),
    );
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
          conversionToBase: u.isBaseUnit ? 1 : Number(u.conversionToBase),
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
            : msg || "Không thể tạo mới sản phẩm.",
        );
      } else {
        setErrorMsg("Đã xảy ra lỗi khi tạo sản phẩm.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseUnitLabel =
    units.find((u) => u.isBaseUnit)?.unitName || units[0]?.unitName || "Đơn vị";

  return (
    <>
      {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

      <form onSubmit={handleSubmit} className={styles.formBody}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Mã SKU / Mã Vạch *</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="VD: MED-VITC-500"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Tên Thuốc / Sản Phẩm *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Vitamin C 500mg"
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
              required
            >
              {categories.length === 0 ? (
                <option value="">Đang tải danh mục...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
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
          <label>Hướng dẫn sử dụng / Hoạt chất</label>
          <input
            value={usageInstructions}
            onChange={(e) => setUsageInstructions(e.target.value)}
            placeholder="VD: Uống sau ăn bữa sáng, 1 viên mỗi ngày."
          />
        </div>

        <div className={styles.unitSection}>
          <div className={styles.unitHeader}>
            <label>Quy cách đóng gói & Đơn vị bán lẻ</label>
            <div className={styles.presetGroup}>
              <button
                type="button"
                onClick={handleAddUnit}
                className={styles.addUnitBtn}
              >
                <Plus size={14} /> Thêm cấp đơn vị
              </button>
            </div>
          </div>

          <datalist id="common-units">
            <option value="Viên" />
            <option value="Vỉ" />
            <option value="Hộp" />
            <option value="Chai" />
            <option value="Tuýp" />
            <option value="Lọ" />
            <option value="Gói" />
            <option value="Ống" />
            <option value="Cái" />
            <option value="Thùng" />
          </datalist>

          {units.map((unit, idx) => (
            <div key={idx} className={styles.unitRow}>
              <div className={styles.inputWrapper}>
                <input
                  list="common-units"
                  placeholder="VD: Chai, Tuýp, Viên..."
                  value={unit.unitName}
                  onChange={(e) => {
                    const next = [...units];
                    next[idx] = { ...next[idx], unitName: e.target.value };
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
                    next[idx] = {
                      ...next[idx],
                      conversionToBase: Number(e.target.value),
                    };
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
                    next[idx] = {
                      ...next[idx],
                      sellingPrice: Number(e.target.value),
                    };
                    setUnits(next);
                  }}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.tagWrapper}>
                <span
                  onClick={() => handleSetBaseUnit(idx)}
                  title="Bấm để đặt làm đơn vị gốc"
                  className={`${unit.isBaseUnit ? styles.baseTag : styles.convertTag} ${!unit.isBaseUnit ? styles.clickableTag : ""}`}
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
            💡 <strong>Quy đổi hiện tại:</strong> 1 {baseUnitLabel} = 1 (Đơn vị
            gốc)
            {units
              .filter((u) => !u.isBaseUnit && u.unitName.trim())
              .map(
                (u) =>
                  ` | 1 ${u.unitName} = ${u.conversionToBase} ${baseUnitLabel}`,
              )
              .join("")}
            .
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.btnSubmit}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu Sản Phẩm Vào Kho"}
          </button>
        </div>
      </form>
    </>
  );
};

export const CreateProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Thêm Mới Sản Phẩm & Đơn Vị Quy Đổi</h3>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <CreateProductFormContent onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
};
