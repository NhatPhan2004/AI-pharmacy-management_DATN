import { useState, useEffect, useCallback } from "react";
import {
  inventoryApi,
  type IPurchaseOrderRow,
  type ISupplierItem,
  type ISupplierPayload,
} from "../api/inventory.api";

export const useInventoryData = (onNotify: (msg: string) => void) => {
  const [receiptHistory, setReceiptHistory] = useState<IPurchaseOrderRow[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplierItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  useEffect(() => {
    let isCancelled = false;

    const initData = async () => {
      try {
        setLoadingHistory(true);
        const [supplierRes, historyRes] = await Promise.all([
          inventoryApi.getSuppliers(),
          inventoryApi.getHistory(),
        ]);
        if (!isCancelled) {
          setSuppliers(supplierRes);
          setReceiptHistory(historyRes);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo dữ liệu kho:", err);
      } finally {
        if (!isCancelled) {
          setLoadingHistory(false);
        }
      }
    };

    void initData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const saveSupplier = async (
    payload: ISupplierPayload,
    editId?: string,
  ): Promise<ISupplierItem> => {
    if (editId) {
      const updated = await inventoryApi.updateSupplier(editId, payload);
      setSuppliers((prev) => prev.map((s) => (s.id === editId ? updated : s)));
      onNotify(`Đã cập nhật thông tin NCC: ${updated.name}`);
      return updated;
    }

    const created = await inventoryApi.createSupplier(payload);
    setSuppliers((prev) => [...prev, created]);
    onNotify(`Đã thêm nhà cung cấp mới: ${created.name}`);
    return created;
  };

  const removeSupplier = async (supplier: ISupplierItem): Promise<boolean> => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn ngừng hợp tác với "${supplier.name}"? (Lịch sử phiếu nhập cũ vẫn được giữ nguyên)`,
    );
    if (!confirmed) return false;

    try {
      await inventoryApi.deleteSupplier(supplier.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
      onNotify(`Đã chuyển "${supplier.name}" sang trạng thái ngừng hợp tác.`);
      return true;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Không thể xóa nhà cung cấp này.");
      return false;
    }
  };

  return {
    receiptHistory,
    suppliers,
    loadingHistory,
    loadHistory,
    saveSupplier,
    removeSupplier,
  };
};
