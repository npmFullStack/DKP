// src/routes/notificationRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteAllNotifications,
  getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/', deleteAllNotifications);

export default router;