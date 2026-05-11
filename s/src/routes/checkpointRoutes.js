import express from 'express';
import {
  createCheckpoint,
  getCheckpoints,
  getCheckpoint,
  reactToCheckpoint,
  getCheckpointReaction,
  addComment,
  getComments
} from '../controllers/checkpointController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validate, checkpointValidation } from '../middleware/validation.js';

const router = express.Router();

router.get('/', optionalAuth, getCheckpoints);
router.get('/:id', optionalAuth, getCheckpoint);
router.post('/', authenticateToken, validate(checkpointValidation), createCheckpoint);
router.post('/:id/react', authenticateToken, reactToCheckpoint);
router.get('/:id/reaction', authenticateToken, getCheckpointReaction);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/:id/comments', getComments);

export default router;