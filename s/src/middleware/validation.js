// src/middleware/validation.js
import { body, validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

export const signupValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const signinValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const checkpointValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).optional(),
  body('longitude').isFloat({ min: -180, max: 180 }).optional(),
  body('province').optional().isString(),
  body('municipality').optional().isString(),
  body('barangay').optional().isString(),
];