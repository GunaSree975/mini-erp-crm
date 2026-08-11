import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  createChallanSchema,
} from '../controllers/challanController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', getChallans);
router.get('/:id', getChallanById);

router.post(
  '/',
  requireRole(['ADMIN', 'SALES']),
  validateBody(createChallanSchema),
  createChallan
);

router.patch(
  '/:id/status',
  requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  updateChallanStatus
);

export default router;
