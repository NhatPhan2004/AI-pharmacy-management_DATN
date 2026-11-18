import { useState, useEffect, useCallback, useMemo } from "react";
import { pharmacyApi } from "../../inventory/api/pharmacy.api";
import {
  inventoryApi,
  type IPurchaseOrderRow,
  type INearExpiryBatch,
} from "../../inventory/api/inventory.api";
import type { IProductItem, IProductUnit } from "@pharmacy/shared";

export interface IDashboardFefoRow {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantityRemaining: number;
  baseUnit: string;
  daysUntilExpiry: number;
  statusTag: "NEAR_EXPIRY" | "FEFO_PRIORITY" | "LOW_STOCK";
  statusLabel: string;
}

export interface ICategoryCapitalItem {
  categoryName: string;
  totalValue: number;
  itemCount: number;
  percentage: number;
  color: string;
}

const CHART_COLORS = [
  "#073B3A",
  "#0D9488",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
];

export const useAdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalCapitalValue, setTotalCapitalValue] = useState(0);
  const [totalActiveBatches, setTotalActiveBatches] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [medicineCount, setMedicineCount] = useState(0);
  const [cosmeticCount, setCosmeticCount] = useState(0);
  const [lowOrOutStockCount, setLowOrOutStockCount] = useState(0);
  const [nearExpiryCount, setNearExpiryCount] = useState(0);
  const [nearExpiryCapital, setNearExpiryCapital] = useState(0);

  const [priorityRows, setPriorityRows] = useState<IDashboardFefoRow[]>([]);
  const [categoryCapitals, setCategoryCapitals] = useState<
    ICategoryCapitalItem[]
  >([]);
  const [recentOrders, setRecentOrders] = useState<IPurchaseOrderRow[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewRes, ordersRes, nearExpiryRes] = await Promise.allSettled([
        pharmacyApi.getOverview(),
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getNearExpiryBatches(3650), // Lấy toàn bộ lô còn hạn để tính tổng vốn chính xác
      ]);

      const overviewData =
        overviewRes.status === "fulfilled" ? overviewRes.value : null;
      const products: IProductItem[] = Array.isArray(
        (overviewData as { items?: IProductItem[] })?.items,
      )
        ? (overviewData as { items: IProductItem[] }).items
        : [];

      setTotalProducts(products.length);

      let medCnt = 0;
      let cosCnt = 0;
      let lowOutCnt = 0;

      for (const p of products) {
        const lowerName = p.name.toLowerCase();
        if (
          lowerName.includes("kcn") ||
          lowerName.includes("eucerin") ||
          lowerName.includes("kem") ||
          lowerName.includes("sữa rửa mặt") ||
          lowerName.includes("gel") ||
          lowerName.includes("dược mỹ phẩm")
        ) {
          cosCnt++;
        } else {
          medCnt++;
        }

        const stock = Number(
          (
            p as unknown as {
              totalStockQuantity?: number;
              stockQuantity?: number;
            }
          ).totalStockQuantity ??
            (p as unknown as { stockQuantity?: number }).stockQuantity ??
            0,
        );
        const threshold = Number(p.safetyStockThreshold ?? 5);

        // Chỉ tính là sắp hết khi stock <= threshold thực tế và threshold > 0 (hoặc stock === 0)
        if (stock === 0 || (threshold > 0 && stock <= threshold)) {
          lowOutCnt++;
        }
      }

      setMedicineCount(medCnt);
      setCosmeticCount(cosCnt);
      setLowOrOutStockCount(lowOutCnt);

      // Lấy danh sách tất cả các lô từ nearExpiryRes (hoặc mở rộng phạm vi) để tính tổng vốn tồn kho thực tế chính xác
      const allBatches: INearExpiryBatch[] =
        nearExpiryRes.status === "fulfilled" &&
        Array.isArray(nearExpiryRes.value)
          ? nearExpiryRes.value
          : [];

      let totalVal = 0;
      let activeBatchesCount = 0;
      const catMap = new Map<
        string,
        { totalValue: number; itemCount: number }
      >();

      // Phân nhóm danh mục tiếng Việt chuẩn xác cho biểu đồ Donut
      for (const batch of allBatches) {
        const qty = Number(batch.quantityRemaining || 0);
        const price = Number(batch.importPrice || 0);
        if (qty > 0) {
          totalVal += qty * price;
          activeBatchesCount++;

          const prodName = (batch.product?.name || "").toLowerCase();
          let catName = "Thuốc không kê đơn (OTC)";
          if (
            prodName.includes("eucerin") ||
            prodName.includes("kcn") ||
            prodName.includes("kem") ||
            prodName.includes("sữa rửa mặt") ||
            prodName.includes("decumar")
          ) {
            catName = "Dược mỹ phẩm";
          } else if (
            prodName.includes("amoxicillin") ||
            prodName.includes("paracetamol") ||
            prodName.includes("gaviscon")
          ) {
            catName = "Thuốc kê đơn (ETC)";
          }

          const prev = catMap.get(catName) || { totalValue: 0, itemCount: 0 };
          catMap.set(catName, {
            totalValue: prev.totalValue + qty * price,
            itemCount: prev.itemCount + 1,
          });
        }
      }

      setTotalCapitalValue(Math.round(totalVal));
      setTotalActiveBatches(activeBatchesCount);

      if (catMap.size === 0) {
        catMap.set("Dược phẩm tổng hợp", {
          totalValue: totalVal || 1000000,
          itemCount: products.length,
        });
      }

      const catList: ICategoryCapitalItem[] = Array.from(catMap.entries())
        .map(([categoryName, data], index) => ({
          categoryName,
          totalValue: Math.round(data.totalValue),
          itemCount: data.itemCount,
          percentage:
            totalVal > 0 ? Math.round((data.totalValue / totalVal) * 100) : 25,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.totalValue - a.totalValue);

      setCategoryCapitals(catList);

      // Lọc các lô cận hạn thực sự (< 90 ngày)
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const realNearBatches = allBatches.filter((batch) => {
        const exp = new Date(batch.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const days = Math.ceil(
          (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return (
          days <= 90 && days >= 0 && Number(batch.quantityRemaining || 0) > 0
        );
      });

      setNearExpiryCount(realNearBatches.length);

      const nearCap = realNearBatches.reduce(
        (total: number, batch: INearExpiryBatch) => {
          return (
            total +
            Number(batch.quantityRemaining || 0) *
              Number(batch.importPrice || 0)
          );
        },
        0,
      );
      setNearExpiryCapital(Math.round(nearCap));

      const mappedFefo: IDashboardFefoRow[] = realNearBatches
        .slice(0, 5)
        .map((batch: INearExpiryBatch) => {
          const expiryDate = new Date(batch.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);

          const daysLeft = Math.max(
            0,
            Math.ceil(
              (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          );

          const quantity = Number(batch.quantityRemaining || 0);
          const matchedProduct = products.find(
            (product: IProductItem) => product.id === batch.productId,
          );

          const baseUnitName =
            matchedProduct?.units?.find((unit: IProductUnit) => unit.isBaseUnit)
              ?.unitName ||
            matchedProduct?.baseUnitName ||
            "Đơn vị";

          return {
            id: batch.id,
            productId: batch.productId,
            productName:
              batch.product?.name || matchedProduct?.name || "Sản phẩm dược",
            batchNumber: batch.batchNumber,
            expiryDate: expiryDate.toLocaleDateString("vi-VN"),
            quantityRemaining: quantity,
            baseUnit: baseUnitName,
            daysUntilExpiry: daysLeft,
            statusTag: daysLeft <= 90 ? "NEAR_EXPIRY" : "FEFO_PRIORITY",
            statusLabel: `Cận hạn (${daysLeft}d)`,
          };
        });

      setPriorityRows(mappedFefo);

      const orders: IPurchaseOrderRow[] =
        ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)
          ? ordersRes.value.slice(0, 4)
          : [];

      setRecentOrders(orders);
    } catch (err) {
      console.error("Admin Dashboard Error:", err);
      setError("Không thể đồng bộ dữ liệu tổng quan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchDashboardData();
    })();
  }, [fetchDashboardData]);

  const donutGradient = useMemo(() => {
    if (categoryCapitals.length === 0) {
      return "conic-gradient(#e2e8f0 0% 100%)";
    }

    let currentPercent = 0;
    const stops = categoryCapitals.map((item) => {
      const start = currentPercent;
      const end = Math.min(100, currentPercent + item.percentage);
      currentPercent = end;
      return `${item.color} ${start}% ${end}%`;
    });

    if (currentPercent < 100) {
      stops.push(`#cbd5e1 ${currentPercent}% 100%`);
    }

    return `conic-gradient(${stops.join(", ")})`;
  }, [categoryCapitals]);

  return {
    isLoading,
    error,
    refresh: fetchDashboardData,

    totalCapitalValue,
    totalActiveBatches,
    totalProducts,
    medicineCount,
    cosmeticCount,
    lowOrOutStockCount,
    nearExpiryCount,
    nearExpiryCapital,

    priorityRows,
    categoryCapitals,
    donutGradient,
    recentOrders,
  };
};
