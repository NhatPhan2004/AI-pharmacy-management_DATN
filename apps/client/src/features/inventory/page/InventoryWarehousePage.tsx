import React, { useState } from "react";
import { Boxes, Plus, FileText, CheckCircle2, Building2 } from "lucide-react";
import {
  ReceiptDetailModal,
  type IReceiptDetailData,
} from "../components/ReceiptDetailModal";
import { SupplierFormModal } from "../components/SupplierFormModal";
import { ReceiptHistoryTab } from "../components/ReceiptHistoryTab";
import { StockImportTab } from "../components/StockImportTab";
import { SupplierManagerTab } from "../components/SupplierManagerTab";
import { useInventoryData } from "../hooks/useInventoryData";
import { useStockImportForm } from "../hooks/useStockImportForm";
import {
  inventoryApi,
  type ISupplierItem,
  type ISupplierPayload,
} from "../api/inventory.api";
import styles from "./InventoryWarehousePage.module.scss";

export const InventoryWarehousePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "history" | "create" | "suppliers"
  >("history");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] =
    useState<IReceiptDetailData | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplierItem | null>(
    null,
  );

  const isAdmin = (() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return true;
      const parsed = JSON.parse(rawUser) as { role?: string };
      return parsed.role === "ADMIN";
    } catch {
      return true;
    }
  })();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const {
    receiptHistory,
    suppliers,
    loadingHistory,
    loadHistory,
    saveSupplier,
    removeSupplier,
  } = useInventoryData(showToast);

  const importForm = useStockImportForm({
    isActive: activeTab === "create",
    suppliers,
    onSuccess: (msg) => {
      showToast(msg);
      setActiveTab("history");
      void loadHistory();
    },
  });

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await inventoryApi.getDetail(id);
      setViewingReceipt(detail);
    } catch (err) {
      console.error("Không thể lấy chi tiết phiếu nhập:", err);
    }
  };

  const handleSaveSupplier = async (
    payload: ISupplierPayload,
    editId?: string,
  ) => {
    const saved = await saveSupplier(payload, editId);
    if (!editId) {
      importForm.setSupplierId(saved.id);
    }
  };

  return (
    <div className={styles.container}>
      {toastMessage && (
        <div className={styles.toastSuccess}>
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Quản Lý Kho Hàng & Nhập Lô FEFO</h2>
          <p className={styles.subtitle}>
            Theo dõi chứng từ nhập kho, kiểm soát số lượng và đồng bộ hạn dùng
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
          {isAdmin && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === "create" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("create")}
            >
              <Plus size={15} /> Lập Phiếu Mới
            </button>
          )}
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "suppliers" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("suppliers")}
          >
            <Building2 size={15} /> Nhà Cung Cấp ({suppliers.length})
          </button>
        </div>
      </div>

      {activeTab !== "create" && (
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
          <div
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => setActiveTab("history")}
          >
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
          <div
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => setActiveTab("suppliers")}
          >
            <div className={`${styles.statIcon} ${styles.statIconWarning}`}>
              <Building2 size={22} />
            </div>
            <div className={styles.statMeta}>
              <span>Nhà Cung Cấp Hợp Tác</span>
              <strong className={styles.statMetaTextWarning}>
                {suppliers.length} Đơn vị
              </strong>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <ReceiptHistoryTab
          receiptHistory={receiptHistory}
          loading={loadingHistory}
          isAdmin={isAdmin}
          onCreateNew={() => setActiveTab("create")}
          onViewDetail={(id) => void handleViewDetail(id)}
        />
      )}

      {activeTab === "create" && (
        <StockImportTab
          suppliers={suppliers}
          availableProducts={importForm.availableProducts}
          isAdmin={isAdmin}
          supplierId={importForm.supplierId}
          onSupplierChange={importForm.setSupplierId}
          invoiceNumber={importForm.invoiceNumber}
          onInvoiceNumberChange={importForm.setInvoiceNumber}
          note={importForm.note}
          onNoteChange={importForm.setNote}
          receiptGroups={importForm.receiptGroups}
          isSubmitting={importForm.isSubmitting}
          totalAmount={importForm.totalAmount}
          totalBaseQty={importForm.totalBaseQty}
          totalBatchesCount={importForm.totalBatchesCount}
          onQuickAddSupplier={() => {
            setEditingSupplier(null);
            setIsSupplierModalOpen(true);
          }}
          onSelectProduct={importForm.selectProduct}
          onAddBatch={importForm.addBatchToProduct}
          onUpdateBatch={importForm.updateBatch}
          onRemoveBatch={importForm.removeBatch}
          onRemoveProductGroup={importForm.removeProductGroup}
          onSubmit={() => void importForm.submitReceipt()}
        />
      )}

      {activeTab === "suppliers" && (
        <SupplierManagerTab
          suppliers={suppliers}
          receiptHistory={receiptHistory}
          isAdmin={isAdmin}
          onAdd={() => {
            setEditingSupplier(null);
            setIsSupplierModalOpen(true);
          }}
          onEdit={(sup) => {
            setEditingSupplier(sup);
            setIsSupplierModalOpen(true);
          }}
          onDelete={(sup) => void removeSupplier(sup)}
        />
      )}

      <ReceiptDetailModal
        data={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />

      <SupplierFormModal
        key={
          editingSupplier?.id ??
          (isSupplierModalOpen ? "new-supplier" : "closed")
        }
        isOpen={isSupplierModalOpen}
        initialData={editingSupplier}
        onClose={() => setIsSupplierModalOpen(false)}
        onSubmit={handleSaveSupplier}
      />
    </div>
  );
};
