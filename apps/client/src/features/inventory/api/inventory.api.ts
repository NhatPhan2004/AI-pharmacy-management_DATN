import axios from "axios";
import type { CreatePurchaseOrderInput, IProductItem } from "@pharmacy/shared";
import type { IReceiptDetailData } from "../components/ReceiptDetailModal";

export interface IPurchaseOrderRow {
  id: string;
  poCode: string;
  createdAt: string;
  supplierName: string;
  totalCost: string | number;
  status: string;
  itemCount: string | number;
}

export interface ISupplierItem {
  id: string;
  name: string;
}

export interface IProductImportOption {
  id: string;
  name: string;
  sku: string;
  baseUnit: string;
  units: Array<{ id: string; name: string; rate: number }>;
}

// Định nghĩa interface thay thế hoàn toàn cho 'any'
interface IPurchaseOrderItemRelation {
  id: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  importPrice: number;
  subtotal: number;
  product?: {
    name: string;
    sku: string;
    baseUnitName?: string;
  };
  unit?: {
    unitName: string;
    conversionToBase: number;
  };
}

interface IPurchaseOrderDetailResponse {
  id: string;
  poCode: string;
  createdAt: string;
  invoiceNumber?: string;
  note?: string;
  totalCost: number;
  supplier?: {
    name: string;
  };
  creator?: {
    fullName?: string;
    username?: string;
  };
  items?: IPurchaseOrderItemRelation[];
}

interface IProductsOverviewData {
  items?: IProductItem[];
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const inventoryApi = {
  getHistory: async (): Promise<IPurchaseOrderRow[]> => {
    const res = await apiClient.get<
      { data?: IPurchaseOrderRow[] } | IPurchaseOrderRow[]
    >("/inventory/purchase-orders");
    const raw =
      "data" in res.data && Array.isArray(res.data.data)
        ? res.data.data
        : res.data;
    return Array.isArray(raw) ? raw : [];
  },

  getDetail: async (id: string): Promise<IReceiptDetailData> => {
    const res = await apiClient.get<
      { data?: IPurchaseOrderDetailResponse } | IPurchaseOrderDetailResponse
    >(`/inventory/purchase-orders/${id}`);
    const po: IPurchaseOrderDetailResponse =
      "data" in res.data && res.data.data
        ? res.data.data
        : (res.data as IPurchaseOrderDetailResponse);

    return {
      receiptCode: po.poCode,
      createdAt: new Date(po.createdAt).toLocaleString("vi-VN"),
      supplierName: po.supplier?.name || "Nhà cung cấp",
      invoiceNumber: po.invoiceNumber || "",
      creatorName:
        po.creator?.fullName || po.creator?.username || "Dược sĩ phụ trách",
      note: po.note || "",
      totalAmount: Number(po.totalCost || 0),
      items: (po.items || []).map((item: IPurchaseOrderItemRelation) => ({
        id: item.id,
        productName: item.product?.name || "Thuốc",
        sku: item.product?.sku || "",
        batchNumber: item.batchNumber || "—",
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toLocaleDateString("vi-VN")
          : "—",
        unitName: item.unit?.unitName || "Đơn vị",
        quantity: Number(item.quantity || 0),
        baseUnit: item.product?.baseUnitName || "Viên",
        baseQuantity:
          Number(item.quantity || 0) * Number(item.unit?.conversionToBase || 1),
        costPrice: Number(item.importPrice || 0),
        lineTotal: Number(item.subtotal || 0),
      })),
    };
  },

  importStock: async (
    payload: CreatePurchaseOrderInput,
  ): Promise<{ success: boolean; purchaseOrderId: string }> => {
    const res = await apiClient.post<{
      data?: { success: boolean; purchaseOrderId: string };
    }>("/inventory/import", payload);
    return (
      res.data?.data ||
      (res.data as { success: boolean; purchaseOrderId: string })
    );
  },

  getProductsForImport: async (
    search?: string,
  ): Promise<IProductImportOption[]> => {
    const res = await apiClient.get<
      { data?: IProductsOverviewData } | IProductsOverviewData
    >("/products/overview", { params: { search } });
    const overview =
      "data" in res.data && res.data.data
        ? res.data.data
        : (res.data as IProductsOverviewData);
    const items = overview?.items || [];

    return items.map((p: IProductItem) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      baseUnit: p.baseUnitName || "Viên",
      units: (p.units || []).map((u) => ({
        id: String(u.id),
        name: u.unitName,
        rate: Number(u.conversionToBase || 1),
      })),
    }));
  },

  getSuppliers: async (): Promise<ISupplierItem[]> => {
    try {
      const res = await apiClient.get<
        { data?: ISupplierItem[] } | ISupplierItem[]
      >("/inventory/suppliers");
      const list =
        "data" in res.data && res.data.data
          ? res.data.data
          : (res.data as ISupplierItem[]);
      if (Array.isArray(list) && list.length > 0) {
        return list.map((s: ISupplierItem) => ({
          id: s.id,
          name: s.name,
        }));
      }
    } catch (err: unknown) {
      console.warn("Chưa tải được NCC từ server, dùng UUID thật từ DB:", err);
    }

    return [
      {
        id: "29ebd603-071e-4c76-96a9-85e8d99c37ce",
        name: "Dược Hậu Giang (DHG Pharma)",
      },
      {
        id: "38010c64-d427-4632-a4fa-38891aa572a1",
        name: "Dược Phẩm Domesco",
      },
    ];
  },
};
