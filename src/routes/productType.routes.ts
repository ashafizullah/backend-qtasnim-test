import express from 'express';
import { validate } from '../middlewares/validate';
import {
  createProductType,
  deleteProductType,
  findAllProductType,
  findProductType,
  updateProductType,
} from '../controllers/productType.controller';
import { createProductTypeSchema, updateProductTypeSchema } from '../schemas/productType.schema';

const router = express.Router();

router.route('/').get(findAllProductType).post(validate(createProductTypeSchema), createProductType);
router
  .route('/:productTypeId')
  .get(findProductType)
  .put(validate(updateProductTypeSchema), updateProductType)
  .delete(deleteProductType);

export default router;
