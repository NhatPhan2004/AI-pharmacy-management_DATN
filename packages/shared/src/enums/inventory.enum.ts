export enum BatchStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  EXPIRED = "EXPIRED",
  DISCONTINUED = "DISCONTINUED",
}

export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum InventoryTransactionType {
  IMPORT = "IMPORT",
  EXPORT_POS = "EXPORT_POS",
  DISPOSAL = "DISPOSAL",
  ADJUSTMENT = "ADJUSTMENT",
}
