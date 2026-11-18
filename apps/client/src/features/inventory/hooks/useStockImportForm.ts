import { useState, useEffect } from "react";
import type { CreatePurchaseOrderInput } from "@pharmacy/shared";
import {
  inventoryApi,
  type IProductImportOption,
  type ISupplierItem,
} from "../api/inventory.api";

export interface IBatchRow {
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

export interface IReceiptProductGroup {
  productId: string;
  productName: string;
  sku: string;
  baseUnit: string;
  units: Array<{
    id: string;
    name: string;
    rate: number;
    sellingPrice?: number;
  }>;
  batches: IBatchRow[];
}

interface Params {
  isActive: boolean;
  suppliers: ISupplierItem[];
  onSuccess: (msg: string) => void;
}

export const useStockImportForm = ({
  isActive,
  suppliers,
  onSuccess,
}: Params) => {
  const [availableProducts, setAvailableProducts] = useState<
    IProductImportOption[]
  >([]);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [note, setNote] = useState("");
  const [receiptGroups, setReceiptGroups] = useState<IReceiptProductGroup[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveSupplierId = suppliers.some((s) => s.id === supplierId)
    ? supplierId
    : suppliers[0]?.id || "";

  useEffect(() => {
    let isCancelled = false;
    if (isActive) {
      void inventoryApi
        .getProductsForImport()
        .then((res) => {
          if (!isCancelled) setAvailableProducts(res);
        })
        .catch((err) =>
          console.error("Lỗi tải danh sách thuốc nhập kho:", err),
        );
    }
    return () => {
      isCancelled = true;
    };
  }, [isActive]);

  const selectProduct = (prod: IProductImportOption) => {
    setReceiptGroups((prev) => {
      if (prev.some((g) => g.productId === prod.id)) return prev;

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

  const addBatchToProduct = (productIndex: number) => {
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

      return prev.map((group, idx) =>
        idx === productIndex
          ? { ...group, batches: [...group.batches, newBatch] }
          : group,
      );
    });
  };

  const updateBatch = (
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

  const removeBatch = (prodIdx: number, batchIdx: number) => {
    const next = [...receiptGroups];
    next[prodIdx].batches.splice(batchIdx, 1);
    if (next[prodIdx].batches.length === 0) next.splice(prodIdx, 1);
    setReceiptGroups(next);
  };

  const removeProductGroup = (prodIdx: number) => {
    setReceiptGroups(receiptGroups.filter((_, i) => i !== prodIdx));
  };

  const submitReceipt = async () => {
    if (!effectiveSupplierId) {
      alert("Vui lòng chọn Nhà cung cấp.");
      return;
    }

    const hasError = receiptGroups.some((g) =>
      g.batches.some(
        (b) =>
          !b.batchNumber.trim() ||
          !b.expiryDate ||
          b.isDateInvalid ||
          b.quantity <= 0,
      ),
    );

    if (hasError) {
      alert(
        "Vui lòng kiểm tra lại: Một số lô chưa nhập Mã lô, Hạn dùng không hợp lệ hoặc Số lượng nhỏ hơn 1.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreatePurchaseOrderInput & {
        invoiceNumber?: string;
        note?: string;
      } = {
        supplierId: effectiveSupplierId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        note: note.trim() || undefined,
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
      setReceiptGroups([]);
      setInvoiceNumber("");
      setNote("");
      onSuccess(
        `Nhập kho thành công! Mã phiếu: ${result.purchaseOrderId || "Hoàn tất"}`,
      );
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

  return {
    availableProducts,
    supplierId: effectiveSupplierId,
    setSupplierId,
    invoiceNumber,
    setInvoiceNumber,
    note,
    setNote,
    receiptGroups,
    isSubmitting,
    totalAmount,
    totalBaseQty,
    totalBatchesCount,
    selectProduct,
    addBatchToProduct,
    updateBatch,
    removeBatch,
    removeProductGroup,
    submitReceipt,
  };
};
