import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
  customerSchema,
  followUpSchema,
} from '../controllers/customerController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post(
  '/',
  requireRole(['ADMIN', 'SALES']),
  validateBody(customerSchema),
  createCustomer
);
router.put(
  '/:id',
  requireRole(['ADMIN', 'SALES']),
  validateBody(customerSchema),
  updateCustomer
);
router.post(
  '/:id/follow-ups',
  requireRole(['ADMIN', 'SALES']),
  validateBody(followUpSchema),
  addFollowUpNote
);

export default router;
