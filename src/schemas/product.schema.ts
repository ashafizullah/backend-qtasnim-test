import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    productName: z.string().min(1).max(255),
    stock: z.number().int().min(0),
    price: z.number().int().min(0),
    productTypeId: z.string(),
  }),
});

export const params = z.object({
  productId: z.string(),
});

export const updateProductSchema = z.object({
  params,
  body: z.object({
    productName: z.string().min(1).max(255).optional(),
    stock: z.number().int().min(0).optional(),
    price: z.number().int().min(0).optional(),
    productTypeId: z.string(),
  }),
});

export const filterQuery = z.object({
  limit: z.number().default(1),
  page: z.number().default(10),
  productName: z.string().optional(),
  sortBy: z.string().optional(),
  orderBy: z.string().optional(),
  productTypeId: z.string().optional(),
});

export type ParamsInput = z.TypeOf<typeof params>;
export type FilterQueryInput = z.TypeOf<typeof filterQuery>;
export type CreateProductInput = z.TypeOf<typeof createProductSchema>['body'];
export type UpdateProductInput = z.TypeOf<typeof updateProductSchema>;
