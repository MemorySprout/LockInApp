import { Router } from 'express';
import * as authController from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout); 

export default router;