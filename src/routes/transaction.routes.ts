import express from 'express';
import { validate } from '../middlewares/validate';
import {
  createTransaction,
  deleteTransaction,
  findAllTransaction,
  findTransaction,
  updateTransaction,
	getMostSoldProductByProductTypeId
} from '../controllers/transaction.controller';
import { createTransactionSchema, updateTransactionSchema } from '../schemas/transaction.schema';

const router = express.Router();

router.route('/').get(findAllTransaction).post(validate(createTransactionSchema), createTransaction);
router
  .route('/:transactionId')
  .get(findTransaction)
  .put(validate(updateTransactionSchema), updateTransaction)
  .delete(deleteTransaction);
router
	.route('/:productTypeId/most-sold-product')
	.get(getMostSoldProductByProductTypeId);

export default router;
