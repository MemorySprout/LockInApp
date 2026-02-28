import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};