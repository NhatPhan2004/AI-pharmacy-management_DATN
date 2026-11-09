import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Boxes,
  Plus,
  FileText,
  Search,
  Trash2,
  CheckCircle2,
  Layers,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  ReceiptDetailModal,
  IReceiptDetailData,
} from "../components/ReceiptDetailModal";
import styles from "./InventoryWarehousePage.module.scss";
import type { CreatePurchaseOrderInput } from "@pharmacy/shared";
import {
  inventoryApi,
  type IPurchaseOrderRow,
  type ISupplierItem,
  type IProductImportOption,
} from "../api/inventory.api";

interface IBatchRow {
  id: string;
  batchNumber: string;
  expiryDate: string;
  unitId: string;
  unitName: string;
  rate: number;
  quantity: number;
  costPrice: number;
  lineTotal: number;
  isDateInvalid?: boolean;
}

interface IReceiptProductGroup {
  productId: string;
  productName: string;
  sku: string;
  baseUnit: string;
  units: Array<{ id: string; name: string; rate: number }>;
  batches: IBatchRow[];
}

export const InventoryWarehousePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"history" | "create">("history");

  const [receiptHistory, setReceiptHistory] = useState<IPurchaseOrderRow[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplierItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<
    IProductImportOption[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [note, setNote] = useState("");
  const [receiptGroups, setReceiptGroups] = useState<IReceiptProductGroup[]>(
    [],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] =
    useState<IReceiptDetailData | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (activeTab === "create") {
      const loadSuppliersAndProducts = async () => {
        try {
          const [supplierRes, prodRes] = await Promise.all([
            inventoryApi.getSuppliers(),
            inventoryApi.getProductsForImport(),
          ]);

          if (!isCancelled) {
            setSuppliers(supplierRes);
            if (supplierRes.length > 0) {
              setSupplierId(supplierRes[0].id);
            }
            setAvailableProducts(prodRes);
          }
        } catch (err) {
          console.error("Lỗi tải thông tin tạo phiếu:", err);
        }
      };

      void loadSuppliersAndProducts();
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

  // 1. Hàm loadHistory dùng khi bấm Submit form nhập kho thành công
  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await inventoryApi.getHistory();
      setReceiptHistory(data);
    } catch (err) {
      console.error("Lỗi nạp lịch sử phiếu nhập:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // 2. useEffect tải lịch sử: chạy luồng fetch bất đồng bộ, KHÔNG gọi setLoadingHistory đồng bộ bên ngoài
  useEffect(() => {
    let isCancelled = false;

    if (activeTab === "history") {
      const syncHistory = async () => {
        try {
          setLoadingHistory(true);
          const data = await inventoryApi.getHistory();
          if (!isCancelled) {
            setReceiptHistory(data);
          }
        } catch (err) {
          console.error("Lỗi nạp lịch sử phiếu nhập:", err);
        } finally {
          if (!isCancelled) {
            setLoadingHistory(false);
          }
        }
      };

      void syncHistory();
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

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

  const handleSelectProduct = (prod: IProductImportOption) => {
    setIsDropdownOpen(false);
    setSearchTerm("");

    setReceiptGroups((prev) => {
      const existing = prev.some((g) => g.productId === prod.id);
      if (existing) return prev;

      const defaultUnit = prod.units[0] || {
        id: "default",
        name: prod.baseUnit,
        rate: 1,
      };
      const initialBatch: IBatchRow = {
        id: crypto.randomUUID(),
        batchNumber: "",
        expiryDate: "",
        unitId: defaultUnit.id,
        unitName: defaultUnit.name,
        rate: defaultUnit.rate,
        quantity: 1,
        costPrice: 0,
        lineTotal: 0,
        isDateInvalid: false,
      };

      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          baseUnit: prod.baseUnit,
          units: prod.units.length > 0 ? prod.units : [defaultUnit],
          batches: [initialBatch],
        },
      ];
    });
  };

  const handleAddBatchToProduct = (productIndex: number) => {
    setReceiptGroups((prev) => {
      const targetGroup = prev[productIndex];
      if (!targetGroup) return prev;

      const defaultUnit = targetGroup.units[0];
      const newBatch: IBatchRow = {
        id: crypto.randomUUID(),
        batchNumber: "",
        expiryDate: "",
        unitId: defaultUnit.id,
        unitName: defaultUnit.name,
        rate: defaultUnit.rate,
        quantity: 1,
        costPrice: 0,
        lineTotal: 0,
        isDateInvalid: false,
      };

      return prev.map((group, idx) => {
        if (idx !== productIndex) return group;
        return {
          ...group,
          batches: [...group.batches, newBatch],
        };
      });
    });
  };

  const handleUpdateBatch = (
    prodIdx: number,
    batchIdx: number,
    field: keyof IBatchRow,
    value: string | number,
  ) => {
    const next = [...receiptGroups];
    const batch = { ...next[prodIdx].batches[batchIdx], [field]: value };

    if (field === "quantity" || field === "costPrice") {
      batch.lineTotal =
        Number(batch.quantity || 0) * Number(batch.costPrice || 0);
    }

    if (field === "unitId") {
      const selectedUnit = next[prodIdx].units.find((u) => u.id === value);
      if (selectedUnit) {
        batch.unitName = selectedUnit.name;
        batch.rate = selectedUnit.rate;
      }
    }

    if (field === "expiryDate" && typeof value === "string") {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        batch.isDateInvalid = selectedDate <= today;
      } else {
        batch.isDateInvalid = false;
      }
    }

    next[prodIdx].batches[batchIdx] = batch;
    setReceiptGroups(next);
  };

  const handleRemoveBatch = (prodIdx: number, batchIdx: number) => {
    const next = [...receiptGroups];
    next[prodIdx].batches.splice(batchIdx, 1);
    if (next[prodIdx].batches.length === 0) {
      next.splice(prodIdx, 1);
    }
    setReceiptGroups(next);
  };

  const handleRemoveProductGroup = (prodIdx: number) => {
    setReceiptGroups(receiptGroups.filter((_, i) => i !== prodIdx));
  };

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await inventoryApi.getDetail(id);
      setViewingReceipt(detail);
    } catch (err) {
      console.error("Không thể lấy chi tiết phiếu nhập:", err);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!supplierId) {
      alert("Vui lòng chọn Nhà cung cấp.");
      return;
    }

    let hasError = false;
    receiptGroups.forEach((group) => {
      group.batches.forEach((batch) => {
        if (
          !batch.batchNumber.trim() ||
          !batch.expiryDate ||
          batch.isDateInvalid ||
          batch.quantity <= 0
        ) {
          hasError = true;
        }
      });
    });

    if (hasError) {
      alert(
        "Vui lòng kiểm tra lại: Một số lô chưa nhập Mã lô, Hạn dùng không hợp lệ hoặc Số lượng nhỏ hơn 1.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreatePurchaseOrderInput = {
        supplierId,
        items: receiptGroups.flatMap((group) =>
          group.batches.map((batch) => ({
            productId: group.productId,
            unitId: batch.unitId,
            quantity: Number(batch.quantity),
            importPrice: Number(batch.costPrice),
            batchNumber: batch.batchNumber.trim(),
            manufacturingDate: new Date().toISOString(),
            expiryDate: new Date(batch.expiryDate).toISOString(),
          })),
        ),
      };

      const result = await inventoryApi.importStock(payload);

      setToastMessage(
        `Nhập kho thành công! Mã phiếu: ${result.purchaseOrderId || "Hoàn tất"}`,
      );
      setTimeout(() => setToastMessage(null), 4000);

      setReceiptGroups([]);
      setInvoiceNumber("");
      setNote("");
      setActiveTab("history");
      void loadHistory();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra trong quá trình nhập kho.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = receiptGroups.reduce(
    (sum, g) => sum + g.batches.reduce((bSum, b) => bSum + b.lineTotal, 0),
    0,
  );
  const totalBaseQty = receiptGroups.reduce(
    (sum, g) =>
      sum + g.batches.reduce((bSum, b) => bSum + b.quantity * b.rate, 0),
    0,
  );
  const totalBatchesCount = receiptGroups.reduce(
    (sum, g) => sum + g.batches.length,
    0,
  );

  return (
    <div className={styles.container}>
      {toastMessage && (
        <div className={styles.toastSuccess}>
          <CheckCircle2 size={18} className={styles.toastIcon} />
          {toastMessage}
        </div>
      )}

      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Quản Lý Kho Hàng & Nhập Lô FEFO</h2>
          <p className={styles.subtitle}>
            Theo dõi chứng từ nhập kho, đồng bộ hạn dùng và kiểm soát số lượng
            theo Base Unit
          </p>
        </div>
        <div className={styles.tabsGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "history" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <FileText size={15} /> Lịch Sử Phiếu Nhập
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "create" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <Plus size={15} /> Lập Phiếu Mới
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Boxes size={22} />
              </div>
              <div className={styles.statMeta}>
                <span>Tổng Giá Trị Nhập Kho</span>
                <strong>
                  {receiptHistory
                    .reduce((sum, r) => sum + Number(r.totalCost || 0), 0)
                    .toLocaleString("vi-VN")}{" "}
                  đ
                </strong>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
                <FileText size={22} />
              </div>
              <div className={styles.statMeta}>
                <span>Tổng Phiếu Nhập Đã Lập</span>
                <strong className={styles.statMetaTextPrimary}>
                  {receiptHistory.length} Phiếu
                </strong>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconWarning}`}>
                <Boxes size={22} />
              </div>
              <div className={styles.statMeta}>
                <span>Nhà Cung Cấp Hợp Tác</span>
                <strong className={styles.statMetaTextWarning}>
                  {suppliers.length || 3} Đơn vị
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableToolbar}>
              <div className={styles.searchBox}>
                <Search size={16} color="#94a3b8" />
                <input placeholder="Tìm theo mã phiếu PNK, số hóa đơn VAT..." />
              </div>
              <button
                type="button"
                className={styles.btnCreateReceipt}
                onClick={() => setActiveTab("create")}
              >
                <Plus size={16} /> Lập Phiếu Nhập Mới
              </button>
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
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={7} className={styles.tableStatusMessage}>
                        Đang đồng bộ dữ liệu phiếu nhập từ máy chủ...
                      </td>
                    </tr>
                  ) : receiptHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className={`${styles.tableStatusMessage} ${styles.muted}`}
                      >
                        Chưa có phiếu nhập kho nào trong cơ sở dữ liệu.
                      </td>
                    </tr>
                  ) : (
                    receiptHistory.map((receipt) => (
                      <tr key={receipt.id}>
                        <td className={styles.receiptCodeCell}>
                          {receipt.poCode}
                        </td>
                        <td>
                          {new Date(receipt.createdAt).toLocaleString("vi-VN")}
                        </td>
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
                            onClick={() => void handleViewDetail(receipt.id)}
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
        </>
      ) : (
        <div className={styles.importGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.searchContainer} ref={searchContainerRef}>
              <div className={styles.searchProductBar}>
                {isSearching ? (
                  <div className={styles.searchSpinner} />
                ) : (
                  <Search size={18} color="#94a3b8" />
                )}
                <input
                  placeholder="Gõ tên thuốc, hoạt chất hoặc quét mã SKU..."
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    setIsSearching(true);
                    setIsDropdownOpen(true);
                  }}
                />
              </div>

              {isDropdownOpen && (
                <ul className={styles.searchResultsDropdown}>
                  {availableProducts.length === 0 ? (
                    <li className={styles.emptyDropdownText}>
                      Không tìm thấy thuốc phù hợp trong database
                    </li>
                  ) : (
                    availableProducts.map((p) => (
                      <li key={p.id} onClick={() => handleSelectProduct(p)}>
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
                Chưa có thuốc nào trong phiếu nhập. Gõ tìm kiếm phía trên để
                thêm mặt hàng từ Database.
              </div>
            ) : (
              receiptGroups.map((group, prodIdx) => (
                <div
                  key={group.productId}
                  className={styles.productReceiptCard}
                >
                  <div className={styles.productHeader}>
                    <div className={styles.productInfo}>
                      <span className={styles.name}>{group.productName}</span>
                      <span className={styles.sku}>SKU: {group.sku}</span>
                    </div>
                    <div className={styles.headerActions}>
                      <button
                        type="button"
                        onClick={() => handleAddBatchToProduct(prodIdx)}
                        className={styles.btnAddBatch}
                      >
                        <Layers size={13} /> + Thêm Lô
                      </button>
                      <button
                        type="button"
                        title="Xóa toàn bộ thuốc này"
                        onClick={() => handleRemoveProductGroup(prodIdx)}
                        className={styles.btnRemoveProduct}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <table className={styles.batchSubTable}>
                    <thead>
                      <tr>
                        <th className={styles.colBatchWidth}>
                          Số Lô (Batch) *
                        </th>
                        <th className={styles.colExpiryWidth}>
                          Hạn Dùng (HSD) *
                        </th>
                        <th className={styles.colUnitWidth}>Đơn Vị & SL *</th>
                        <th className={styles.colPriceWidth}>Giá Nhập (đ)</th>
                        <th className={styles.colActionWidth}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.batches.map((batch, batchIdx) => (
                        <tr key={batch.id}>
                          <td>
                            <input
                              placeholder="VD: LOT-2026-A"
                              value={batch.batchNumber}
                              className={
                                !batch.batchNumber && receiptGroups.length > 0
                                  ? styles.inputWrapper
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateBatch(
                                  prodIdx,
                                  batchIdx,
                                  "batchNumber",
                                  e.target.value,
                                )
                              }
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={batch.expiryDate}
                              className={
                                batch.isDateInvalid ? styles.inputError : ""
                              }
                              onChange={(e) =>
                                handleUpdateBatch(
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
                                <AlertCircle
                                  size={10}
                                  className={styles.inlineWarningIcon}
                                />
                                HSD đã hết hoặc quá gần
                              </span>
                            )}
                          </td>
                          <td>
                            <div className={styles.qtyGroup}>
                              <select
                                value={batch.unitId}
                                onChange={(e) =>
                                  handleUpdateBatch(
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
                                  handleUpdateBatch(
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
                                handleUpdateBatch(
                                  prodIdx,
                                  batchIdx,
                                  "costPrice",
                                  Number(e.target.value),
                                )
                              }
                              required
                            />
                            <span className={styles.lineTotalText}>
                              {batch.lineTotal.toLocaleString("vi-VN")} đ
                            </span>
                          </td>
                          <td className={styles.colCenter}>
                            {group.batches.length > 1 && (
                              <button
                                type="button"
                                title="Xóa lô này"
                                onClick={() =>
                                  handleRemoveBatch(prodIdx, batchIdx)
                                }
                                className={styles.btnDeleteBatch}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>

          <div className={styles.rightColumn}>
            <h4 className={styles.cardHeading}>Chứng Từ Nhập Kho</h4>

            <div className={styles.formGroup}>
              <label>Nhà Cung Cấp *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                {suppliers.length === 0 ? (
                  <option value="">Đang nạp nhà cung cấp...</option>
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
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ghi Chú Đợt Nhập</label>
              <textarea
                placeholder="Ghi chú bảo quản, số thùng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                <strong>
                  {totalBaseQty.toLocaleString("vi-VN")} đơn vị gốc
                </strong>
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
              onClick={handleSubmitReceipt}
            >
              <CheckCircle2 size={16} className={styles.submitBtnIcon} />
              {isSubmitting ? "Đang Xử Lý Lưu Kho..." : "Xác Nhận Nhập Kho"}
            </button>
          </div>
        </div>
      )}

      <ReceiptDetailModal
        data={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />
    </div>
  );
};
