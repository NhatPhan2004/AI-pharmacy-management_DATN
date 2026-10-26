import { z } from "zod";

export const ImportBatchItemSchema = z.object({
  productId: z.string(),
  unitId: z.string(),
  batchNumber: z.string().min(1, "The batch number is required").max(50),
  manufacturingDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  quantity: z
    .number()
    .int()
    .positive("The quantity must be a positive integer"),
  importPrice: z
    .number()
    .positive("The import price must be a positive number"),
});

export const CreatePurchaseOrderSchema = z.object({
  supplierId: z.string(),
  items: z
    .array(ImportBatchItemSchema)
    .min(1, "The purchase order must have at least 1 item"),
});

export type CreatePurchaseOrderInput = z.infer<
  typeof CreatePurchaseOrderSchema
>;
