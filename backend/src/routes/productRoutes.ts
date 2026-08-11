import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  addStockMovement,
  getStockMovements,
  productSchema,
  stockMovementSchema,
} from '../controllers/productController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/movements/log', getStockMovements);
router.get('/:id', getProductById);

router.post(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE']),
  validateBody(productSchema),
  createProduct
);
router.put(
  '/:id',
  requireRole(['ADMIN', 'WAREHOUSE']),
  validateBody(productSchema),
  updateProduct
);
router.post(
  '/:id/stock-movement',
  requireRole(['ADMIN', 'WAREHOUSE']),
  validateBody(stockMovementSchema),
  addStockMovement
);

export default router;
