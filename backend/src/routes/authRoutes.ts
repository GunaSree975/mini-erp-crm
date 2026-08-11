import { Router } from 'express';
import { login, getMe, loginSchema } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticateToken, getMe);

export default router;
