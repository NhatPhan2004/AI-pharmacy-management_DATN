import React from "react";
import { usePharmacyOverview } from "../hooks/usePharmacyOverview";
import { usePharmacyModals } from "../hooks/usePharmacyModals";
import { PharmacyMetricsCards } from "../components/PharmacyMetricsCards";
import { PharmacyToolbar } from "../components/PharmacyToolbar";
import { PharmacyTable } from "../components/PharmacyTable";
import { BatchListModal } from "../components/BatchListModal";
import { CreateProductModal } from "../components/CreateProductModal";
import { EditProductModal } from "../components/EditProductModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import styles from "./PharmacyManagement.module.scss";

export const PharmacyManagementPage: React.FC = () => {
  const {
    products,
    categories,
    metrics,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategoryId,
    setSelectedCategoryId,
    statusFilter,
    setStatusFilter,
    fetchOverview,
  } = usePharmacyOverview();

  const {
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
  } = usePharmacyModals(() => void fetchOverview());

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Quản Lý Danh Mục Thuốc</h1>
        <p className={styles.subtitle}>
          Theo dõi danh mục dược phẩm, hệ số quy đổi đơn vị và cảnh báo tồn kho
          FEFO
        </p>
      </div>

      <PharmacyMetricsCards metrics={metrics} />

      <div className={styles.tableCard}>
        <PharmacyToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          categories={categories}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRefresh={() => void fetchOverview()}
          onOpenCreate={() => setIsCreateOpen(true)}
        />

        <PharmacyTable
          products={products}
          loading={loading}
          onOpenBatch={setBatchModalProduct}
          onOpenEdit={setEditModalProduct}
          onOpenDelete={setDeleteModalProduct}
        />
      </div>

      <BatchListModal
        product={batchModalProduct}
        onClose={() => setBatchModalProduct(null)}
      />

      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          void fetchOverview();
        }}
      />

      <EditProductModal
        product={editModalProduct}
        onClose={() => setEditModalProduct(null)}
        onSuccess={() => {
          setEditModalProduct(null);
          void fetchOverview();
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteModalProduct}
        drugName={deleteModalProduct?.name || ""}
        sku={deleteModalProduct?.sku || ""}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalProduct(null)}
      />
    </div>
  );
};
