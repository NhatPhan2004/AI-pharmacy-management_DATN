import { useState, useEffect, useCallback, useMemo } from "react";
import type { IPharmacyOverviewResponse, IProductItem } from "@pharmacy/shared";
import { pharmacyApi } from "../api/pharmacy.api";

export interface ICategoryItem {
  id: string | number;
  name: string;
}

export const usePharmacyOverview = () => {
  const [data, setData] = useState<IPharmacyOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState<ICategoryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pharmacyApi.getOverview(
        searchTerm.trim() || undefined,
        selectedCategoryId || undefined,
      );
      setData(res);
    } catch (error) {
      console.error("Lỗi tải danh mục thuốc:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoryId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      void fetchOverview();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchOverview]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await pharmacyApi.getCategories();
        const list = Array.isArray(res)
          ? res
          : Array.isArray((res as { data?: unknown })?.data)
            ? (res as { data: ICategoryItem[] }).data
            : [];
        setCategories(list);
      } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
        setCategories([]);
      }
    };
    void loadCategories();
  }, []);

  const metrics = data?.metrics || {
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    nearExpiryCount: 0,
  };

  const products: IProductItem[] = useMemo(() => {
    const rawItems = data?.items || [];
    if (statusFilter === "ALL") return rawItems;
    return rawItems.filter((item) => item.status === statusFilter);
  }, [data?.items, statusFilter]);

  return {
    data,
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
  };
};
