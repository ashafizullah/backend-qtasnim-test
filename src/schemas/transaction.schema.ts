import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    buyerName: z.string().min(1).max(255),
    productId: z.string(),
    amountSold: z.number().int().min(0),
    totalPrice: z.number().int().min(0).optional(),
    transactionDate: z.string(),
  }),
});

export const params = z.object({
  transactionId: z.string(),
  productTypeId: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  params,
  body: z.object({
    buyerName: z.string().min(1).max(255).optional(),
    productId: z.string().optional(),
    amountSold: z.number().int().min(0).optional(),
    totalPrice: z.number().int().min(0).optional(),
    transactionDate: z.string().optional(),
  }),
});

export const filterQuery = z.object({
  limit: z.number().default(1),
  page: z.number().default(10),
  buyerName: z.string().optional(),
  sortBy: z.string().optional(),
  orderBy: z.string().optional(),
  productId: z.string().optional(),
	productTypeId: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export type ParamsInput = z.TypeOf<typeof params>;
export type FilterQueryInput = z.TypeOf<typeof filterQuery>;
export type CreateTransactionInput = z.TypeOf<typeof createTransactionSchema>['body'];
export type UpdateTransactionInput = z.TypeOf<typeof updateTransactionSchema>;
