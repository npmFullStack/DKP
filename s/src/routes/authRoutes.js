import express from 'express';
import { signup, signin, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, signupValidation, signinValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/signup', validate(signupValidation), signup);
router.post('/signin', validate(signinValidation), signin);
router.get('/me', authenticateToken, getMe);

export default router;