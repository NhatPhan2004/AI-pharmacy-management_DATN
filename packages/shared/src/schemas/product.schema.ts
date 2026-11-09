import { z } from "zod";

export const CreateProductUnitSchema = z.object({
  unitName: z.string().min(1, "Tên đơn vị không được rỗng"),
  conversionToBase: z.number().int().min(1, "Tỉ lệ quy đổi phải >= 1"),
  sellingPrice: z.number().min(0, "Giá bán không được âm"),
  isBaseUnit: z.boolean(),
});

export const CreateProductSchema = z.object({
  sku: z.string().min(3, "Mã SKU tối thiểu 3 ký tự"),
  name: z.string().min(2, "Tên thuốc không được để trống"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  safetyStockThreshold: z.number().int().min(0).default(20),
  usageInstructions: z.string().optional(),
  defaultStorage: z.string().optional(),
  units: z
    .array(CreateProductUnitSchema)
    .min(1, "Cần ít nhất một đơn vị cơ sở"),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
