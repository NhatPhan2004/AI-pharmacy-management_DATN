import React, { useState, useRef, useEffect } from "react";
import {
  Boxes,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Layers,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import styles from "../page/InventoryWarehousePage.module.scss";
import type { IProductImportOption, ISupplierItem } from "../api/inventory.api";
import type {
  IBatchRow,
  IReceiptProductGroup,
} from "../hooks/useStockImportForm";

interface Props {
  suppliers: ISupplierItem[];
  availableProducts: IProductImportOption[];
  isAdmin: boolean;
  supplierId: string;
  onSupplierChange: (id: string) => void;
  invoiceNumber: string;
  onInvoiceNumberChange: (val: string) => void;
  note: string;
  onNoteChange: (val: string) => void;
  receiptGroups: IReceiptProductGroup[];
  isSubmitting: boolean;
  totalAmount: number;
  totalBaseQty: number;
  totalBatchesCount: number;
  onQuickAddSupplier: () => void;
  onSelectProduct: (prod: IProductImportOption) => void;
  onAddBatch: (prodIdx: number) => void;
  onUpdateBatch: (
    prodIdx: number,
    batchIdx: number,
    field: keyof IBatchRow,
    value: string | number,
  ) => void;
  onRemoveBatch: (prodIdx: number, batchIdx: number) => void;
  onRemoveProductGroup: (prodIdx: number) => void;
  onSubmit: () => void;
}

const generateUniqueBatchCode = (expiryDate?: string): string => {
  const randomTag = Math.random().toString(36).substring(2, 6).toUpperCase();
  if (expiryDate) {
    const compactExp = expiryDate.replace(/-/g, "").slice(2);
    return `LOT-${compactExp}-${randomTag}`;
  }
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `LOT-${yy}${mm}${dd}-${randomTag}`;
};

export const StockImportTab: React.FC<Props> = ({
  suppliers,
  availableProducts,
  isAdmin,
  supplierId,
  onSupplierChange,
  invoiceNumber,
  onInvoiceNumberChange,
  note,
  onNoteChange,
  receiptGroups,
  isSubmitting,
  totalAmount,
  totalBaseQty,
  totalBatchesCount,
  onQuickAddSupplier,
  onSelectProduct,
  onAddBatch,
  onUpdateBatch,
  onRemoveBatch,
  onRemoveProductGroup,
  onSubmit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className={styles.importGrid}>
      <div className={styles.leftColumn}>
        <div className={styles.searchContainer} ref={searchContainerRef}>
          <div className={styles.searchProductBar}>
            <Search size={18} color="#94a3b8" />
            <input
              placeholder="Gõ tên thuốc, hoạt chất hoặc quét mã SKU..."
              value={searchTerm}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
            />
          </div>

          {isDropdownOpen && (
            <ul className={styles.searchResultsDropdown}>
              {filteredProducts.length === 0 ? (
                <li className={styles.emptyDropdownText}>
                  Không tìm thấy thuốc phù hợp trong database
                </li>
              ) : (
                filteredProducts.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setSearchTerm("");
                      onSelectProduct(p);
                    }}
                  >
                    <div>
                      <span className={styles.prodName}>{p.name}</span>
                      <span className={styles.prodSku}>({p.sku})</span>
                    </div>
                    <span className={styles.baseUnitBadge}>
                      Đơn vị gốc: {p.baseUnit}
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {receiptGroups.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <Boxes size={42} className={styles.emptyIcon} />
            Chưa có thuốc nào trong phiếu nhập. Gõ tìm kiếm phía trên để thêm
            mặt hàng từ Database.
          </div>
        ) : (
          receiptGroups.map((group, prodIdx) => {
            const sourceProd = availableProducts.find(
              (p) => p.id === group.productId,
            );

            return (
              <div key={group.productId} className={styles.productReceiptCard}>
                <div className={styles.productHeader}>
                  <div className={styles.productInfo}>
                    <span className={styles.name}>{group.productName}</span>
                    <span className={styles.sku}>SKU: {group.sku}</span>
                  </div>
                  <div className={styles.headerActions}>
                    <button
                      type="button"
                      onClick={() => onAddBatch(prodIdx)}
                      className={styles.btnAddBatch}
                    >
                      <Layers size={13} /> + Thêm Lô
                    </button>
                    <button
                      type="button"
                      title="Xóa toàn bộ thuốc này"
                      onClick={() => onRemoveProductGroup(prodIdx)}
                      className={styles.btnRemoveProduct}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <table className={styles.batchSubTable}>
                  <thead>
                    <tr>
                      <th>Số Lô (Batch) *</th>
                      <th>Hạn Dùng (HSD) *</th>
                      <th>Đơn Vị & SL *</th>
                      <th>Giá Nhập (đ)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.batches.map((batch, batchIdx) => {
                      const selectedUnit =
                        group.units.find((u) => u.id === batch.unitId) ||
                        sourceProd?.units.find((u) => u.id === batch.unitId);

                      const unitSellingPrice = Number(
                        selectedUnit?.sellingPrice || 0,
                      );
                      const unitName = selectedUnit?.name || group.baseUnit;

                      const profitDiff =
                        batch.costPrice > 0 && unitSellingPrice > 0
                          ? unitSellingPrice - batch.costPrice
                          : null;

                      const profitPercent =
                        profitDiff !== null && unitSellingPrice > 0
                          ? Math.round((profitDiff / unitSellingPrice) * 100)
                          : null;

                      return (
                        <tr key={batch.id}>
                          <td>
                            <div className={styles.batchInputGroup}>
                              <input
                                placeholder="VD: LOT-2026-A"
                                value={batch.batchNumber}
                                onChange={(e) =>
                                  onUpdateBatch(
                                    prodIdx,
                                    batchIdx,
                                    "batchNumber",
                                    e.target.value,
                                  )
                                }
                                required
                              />
                              <button
                                type="button"
                                title="Tự động tạo mã lô không trùng"
                                onClick={() =>
                                  onUpdateBatch(
                                    prodIdx,
                                    batchIdx,
                                    "batchNumber",
                                    generateUniqueBatchCode(batch.expiryDate),
                                  )
                                }
                                className={styles.btnAutoBatch}
                              >
                                <Sparkles size={13} />
                              </button>
                            </div>
                          </td>

                          <td>
                            <input
                              type="date"
                              value={batch.expiryDate}
                              onChange={(e) =>
                                onUpdateBatch(
                                  prodIdx,
                                  batchIdx,
                                  "expiryDate",
                                  e.target.value,
                                )
                              }
                              required
                            />
                            {batch.isDateInvalid && (
                              <span className={styles.errorTextSmall}>
                                <AlertCircle size={10} />
                                HSD đã hết hoặc quá gần
                              </span>
                            )}
                          </td>

                          <td>
                            <div className={styles.qtyGroup}>
                              <select
                                value={batch.unitId}
                                onChange={(e) =>
                                  onUpdateBatch(
                                    prodIdx,
                                    batchIdx,
                                    "unitId",
                                    e.target.value,
                                  )
                                }
                              >
                                {group.units.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="1"
                                value={batch.quantity}
                                onChange={(e) =>
                                  onUpdateBatch(
                                    prodIdx,
                                    batchIdx,
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                                required
                              />
                            </div>
                            <span className={styles.conversionText}>
                              ={" "}
                              {(batch.quantity * batch.rate).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              {group.baseUnit}
                            </span>
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={batch.costPrice}
                              onChange={(e) =>
                                onUpdateBatch(
                                  prodIdx,
                                  batchIdx,
                                  "costPrice",
                                  Number(e.target.value),
                                )
                              }
                              required
                            />
                            <span className={styles.lineTotalText}>
                              Thành tiền:{" "}
                              {batch.lineTotal.toLocaleString("vi-VN")} đ
                            </span>
                            {unitSellingPrice > 0 && (
                              <span className={styles.sellingRefText}>
                                Giá bán niêm yết:{" "}
                                <strong>
                                  {unitSellingPrice.toLocaleString("vi-VN")} đ
                                </strong>
                                /{unitName}
                                {profitDiff !== null && (
                                  <span
                                    className={
                                      profitDiff > 0
                                        ? styles.marginPositive
                                        : styles.marginNeutral
                                    }
                                  >
                                    {" "}
                                    (
                                    {profitDiff > 0
                                      ? `Lãi ${profitPercent}%`
                                      : `Chênh ${profitDiff.toLocaleString("vi-VN")} đ`}
                                    )
                                  </span>
                                )}
                              </span>
                            )}
                          </td>

                          <td className={styles.colCenter}>
                            {group.batches.length > 1 && (
                              <button
                                type="button"
                                title="Xóa lô này"
                                onClick={() => onRemoveBatch(prodIdx, batchIdx)}
                                className={styles.btnDeleteBatch}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.rightColumn}>
        <h4 className={styles.cardHeading}>Chứng Từ Nhập Kho</h4>

        <div className={styles.formGroup}>
          <div className={styles.labelWithAction}>
            <label>Nhà Cung Cấp *</label>
            {isAdmin && (
              <button
                type="button"
                className={styles.btnQuickAddSupplier}
                onClick={onQuickAddSupplier}
              >
                <Plus size={12} /> Thêm nhanh NCC
              </button>
            )}
          </div>
          <select
            value={supplierId}
            onChange={(e) => onSupplierChange(e.target.value)}
          >
            {suppliers.length === 0 ? (
              <option value="">Chưa có nhà cung cấp...</option>
            ) : (
              suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Số Hóa Đơn NCC / Mã Vận Đơn</label>
          <input
            placeholder="VD: HD-VAT-88192"
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Ghi Chú Đợt Nhập</label>
          <textarea
            placeholder="Ghi chú bảo quản, số thùng..."
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </div>

        <div className={styles.orderSummary}>
          <div className={styles.summaryRow}>
            <span>Mặt hàng:</span>
            <strong>{receiptGroups.length} loại thuốc</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Tổng số lô:</span>
            <strong>{totalBatchesCount} lô hàng</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Tổng SL quy đổi:</span>
            <strong>{totalBaseQty.toLocaleString("vi-VN")} đơn vị gốc</strong>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Tổng Tiền Hàng:</span>
            <span className={styles.totalPriceGreen}>
              {totalAmount.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.btnSubmitReceipt}
          disabled={receiptGroups.length === 0 || isSubmitting}
          onClick={onSubmit}
        >
          <CheckCircle2 size={16} className={styles.submitBtnIcon} />
          {isSubmitting ? "Đang Xử Lý Lưu Kho..." : "Xác Nhận Nhập Kho"}
        </button>
      </div>
    </div>
  );
};
