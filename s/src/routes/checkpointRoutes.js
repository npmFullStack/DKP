// src/routes/checkpointRoutes.js
import express from 'express';
import {
  createCheckpoint,
  getCheckpoints,
  getCheckpoint,
  reactToCheckpoint,
  getCheckpointReaction,
  addComment,
  getComments,
  uploadImages,
  getUserCheckpoints,
  getNearbyCheckpoints,
  reportCheckpoint,
  updateCheckpointStatus,
  deleteCheckpoint
} from '../controllers/checkpointController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validate, checkpointValidation } from '../middleware/validation.js';

const router = express.Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, getCheckpoints);
router.get('/nearby', optionalAuth, getNearbyCheckpoints);
router.get('/:id', optionalAuth, getCheckpoint);
router.get('/:id/comments', getComments);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below this line require authentication

// Image upload
router.post('/upload', uploadImages);

// Create checkpoint
router.post('/', validate(checkpointValidation), createCheckpoint);

// User's own checkpoints
router.get('/user/me', getUserCheckpoints);

// Reactions
router.post('/:id/react', reactToCheckpoint);
router.get('/:id/reaction', getCheckpointReaction);

// Comments
router.post('/:id/comments', addComment);

// Reporting
router.post('/:id/report', reportCheckpoint);

// Delete checkpoint
router.delete('/:id', deleteCheckpoint);

// Admin routes (optional - add admin middleware if needed)
router.put('/:id/status', updateCheckpointStatus);

export default router;