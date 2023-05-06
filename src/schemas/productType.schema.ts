import { z } from 'zod';

export const createProductTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
  }),
});

export const params = z.object({
  productTypeId: z.string(),
});

export const updateProductTypeSchema = z.object({
  params,
  body: z.object({
    name: z.string().min(1).max(255).optional(),
  }),
});

export const filterQuery = z.object({
  limit: z.number().default(1),
  page: z.number().default(10),
  name: z.string().optional(),
  orderBy: z.string().optional(),
  sortBy: z.string().optional(),
});

export type ParamsInput = z.TypeOf<typeof params>;
export type FilterQueryInput = z.TypeOf<typeof filterQuery>;
export type CreateProductTypeInput = z.TypeOf<typeof createProductTypeSchema>['body'];
export type UpdateProductTypeInput = z.TypeOf<typeof updateProductTypeSchema>;
