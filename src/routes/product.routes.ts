import express from 'express';
import { validate } from '../middlewares/validate';
import {
  createProduct,
  deleteProduct,
  findAllProduct,
  findProduct,
  updateProduct,
} from '../controllers/product.controller';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = express.Router();

router.route('/').get(findAllProduct).post(validate(createProductSchema), createProduct);
router.route('/:productId').get(findProduct).put(validate(updateProductSchema), updateProduct).delete(deleteProduct);

export default router;
