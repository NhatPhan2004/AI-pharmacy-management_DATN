import axios from "axios";
import type {
  IPharmacyOverviewResponse,
  IBatchItem,
  IUpdateProductPayload,
} from "@pharmacy/shared";

export interface ICreateProductUnitInput {
  unitName: string;
  conversionToBase: number;
  sellingPrice: number;
  isBaseUnit: boolean;
}

export interface ICreateProductPayload {
  sku: string;
  name: string;
  categoryId: string;
  safetyStockThreshold?: number;
  usageInstructions?: string;
  defaultStorage?: string;
  units: ICreateProductUnitInput[];
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

export const pharmacyApi = {
  getOverview: async (
    search?: string,
    categoryId?: string,
  ): Promise<IPharmacyOverviewResponse> => {
    const res = await apiClient.get("/products/overview", {
      params: { search, categoryId },
    });
    return res.data?.data || res.data;
  },

  getBatchesByProduct: async (productId: string): Promise<IBatchItem[]> => {
    const res = await apiClient.get(`/products/batches/${productId}`);
    return res.data?.data || res.data || [];
  },

  createProduct: async (payload: ICreateProductPayload): Promise<unknown> => {
    const res = await apiClient.post("/products", payload);
    return res.data?.data || res.data;
  },

  updateProduct: async (
    id: string,
    payload: IUpdateProductPayload,
  ): Promise<unknown> => {
    const res = await apiClient.put(`/products/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
