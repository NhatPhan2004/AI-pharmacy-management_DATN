import { z } from "zod";

export const CreateProductUnitSchema = z.object({
  unitName: z.string().min(1, "The unit name is required").max(50),
  conversionToBase: z
    .number()
    .int()
    .positive("The conversion factor must be a positive integer >= 1"),
  sellingPrice: z
    .number()
    .positive("The selling price must be a positive number"),
  isBaseUnit: z.boolean().default(false),
});

export const CreateProductSchema = z.object({
  categoryId: z.string().min(1, "The category is required"),
  sku: z.string().min(3, "The SKU must be at least 3 characters long").max(50),
  name: z.string().min(2, "The product name is required").max(100),
  usageInstructions: z.string().optional(),
  defaultStorage: z.string().optional(),
  isActive: z.boolean().default(true),
  safetyStockThreshold: z.number().int().nonnegative().default(20),
  units: z
    .array(CreateProductUnitSchema)
    .min(1, "At least one unit is required"),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
