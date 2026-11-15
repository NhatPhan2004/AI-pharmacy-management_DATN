import React from "react";
import { Search, RefreshCw, Plus, Filter } from "lucide-react";
import styles from "../page/PharmacyManagement.module.scss";
import type { ICategoryItem } from "../hooks/usePharmacyOverview";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  categories: ICategoryItem[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
}

export const PharmacyToolbar: React.FC<Props> = ({
  searchTerm,
  onSearchChange,
  selectedCategoryId,
  onSelectCategory,
  categories,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onOpenCreate,
}) => {
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchForm}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm theo tên thuốc, mã SKU, hoạt chất..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onRefresh}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} /> Làm mới
          </button>

          <div className={styles.statusFilterBox}>
            <Filter size={15} />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className={styles.statusSelect}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="IN_STOCK">Đủ tồn kho</option>
              <option value="LOW_STOCK">Sắp hết hàng</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
              <option value="NEAR_EXPIRY">Cận hạn sử dụng</option>
            </select>
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onOpenCreate}
          >
            <Plus size={16} /> Thêm thuốc mới
          </button>
        </div>
      </div>

      <div className={styles.categoryTabs}>
        <button
          type="button"
          className={`${styles.tabItem} ${
            selectedCategoryId === "" ? styles.tabActive : ""
          }`}
          onClick={() => onSelectCategory("")}
        >
          Tất cả danh mục
        </button>

        {Array.isArray(categories) &&
          categories.map((cat) => {
            const catId = String(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.tabItem} ${
                  selectedCategoryId === catId ? styles.tabActive : ""
                }`}
                onClick={() => onSelectCategory(catId)}
              >
                {cat.name}
              </button>
            );
          })}
      </div>
    </>
  );
};
