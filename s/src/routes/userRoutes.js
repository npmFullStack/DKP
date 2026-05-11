// src/routes/userRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  updateProfile,
  changePassword,
  getSettings,
  updateSettings
} from '../controllers/userController.js';

const router = express.Router();

router.use(authenticateToken);

router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;