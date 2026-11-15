import { useState } from "react";
import type { IProductItem } from "@pharmacy/shared";
import { pharmacyApi } from "../api/pharmacy.api";

export const usePharmacyModals = (onDeleteSuccess: () => void) => {
  const [batchModalProduct, setBatchModalProduct] =
    useState<IProductItem | null>(null);
  const [editModalProduct, setEditModalProduct] = useState<IProductItem | null>(
    null,
  );
  const [deleteModalProduct, setDeleteModalProduct] =
    useState<IProductItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    try {
      setIsDeleting(true);
      await pharmacyApi.deleteProduct(deleteModalProduct.id);
      setDeleteModalProduct(null);
      onDeleteSuccess();
    } catch (err: unknown) {
      console.error("Lỗi xóa thuốc:", err);
      const error = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const serverMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(serverMsg)
        ? serverMsg.join(", ")
        : serverMsg || "Không thể xóa thuốc này.";
      alert(displayMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    batchModalProduct,
    setBatchModalProduct,
    editModalProduct,
    setEditModalProduct,
    deleteModalProduct,
    setDeleteModalProduct,
    isCreateOpen,
    setIsCreateOpen,
    isDeleting,
    handleConfirmDelete,
  };
};
