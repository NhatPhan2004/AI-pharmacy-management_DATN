export interface IProductUnit {
  id: string;
  unitName: string;
  conversionToBase: number;
  sellingPrice: number;
  isBaseUnit: boolean;
}

export interface IBatchDetail {
  id: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantityRemaining: number;
  importPrice: number;
  status: "ACTIVE" | "NEAR_EXPIRY" | "EXPIRED" | "OUT_OF_STOCK";
}

export interface IProductItem {
  id: string;
  sku: string;
  name: string;
  activeIngredient?: string;
  categoryId: string;
  categoryName: string;
  usageInstructions?: string;
  defaultStorage?: string;
  safetyStockThreshold: number;
  totalQuantityBase: number;
  baseUnitName: string;
  packagingDisplay: string;
  nearestExpiryDate: string | null;
  minPrice: number;
  maxPrice: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "NEAR_EXPIRY";
  units?: IProductUnit[];
}

export interface IPharmacyOverviewResponse {
  metrics: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    nearExpiryCount: number;
  };
  items: IProductItem[];
}
export interface IBatchItem {
  id: string;
  productId: string;
  batchNumber: string;
  initialQuantity: number;
  quantityRemaining: number;
  costPrice: number;
  manufactureDate?: string | null;
  expiryDate: string;
  isFefoPriority: boolean;
  daysUntilExpiry: number;
  status: "SAFE" | "NEAR_EXPIRY" | "EXPIRED" | "DEPLETED";
}

export interface IUpdateProductPayload {
  name?: string;
  categoryId?: string;
  safetyStockThreshold?: number;
  usageInstructions?: string;
  defaultStorage?: string;
  units?: {
    id?: string;
    unitName: string;
    conversionToBase: number;
    sellingPrice: number;
    isBaseUnit: boolean;
  }[];
}
