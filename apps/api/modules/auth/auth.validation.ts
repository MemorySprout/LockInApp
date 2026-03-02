import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long')
    .toLowerCase()
    .trim(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long (max 128 characters)'),
});

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const issues = result.error?.issues ?? result.error?.errors ?? [];
        const errors = issues.map((e) => e.message).join(' | ') || 'Invalid input';
        return res.status(400).json({ message: errors });
      }
      req.body = result.data;
      next();
    } catch {
      return res.status(400).json({ message: 'Invalid request data' });
    }
  };
};
