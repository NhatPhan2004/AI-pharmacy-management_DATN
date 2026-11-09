export interface ICreateReceiptBatchItem {
  batchNumber: string;
  manufacturingDate?: string | null;
  expiryDate: string;
  unitId: string;
  quantity: number;
  costPrice: number;
}

export interface ICreateReceiptProductGroup {
  productId: string;
  batches: ICreateReceiptBatchItem[];
}

export interface ICreateGoodsReceiptPayload {
  supplierId: string;
  invoiceNumber?: string;
  note?: string;
  items: ICreateReceiptProductGroup[];
}

export interface ISupplierItem {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}
