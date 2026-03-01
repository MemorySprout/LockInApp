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

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyAccessToken(token);
    } catch {
      req.user = undefined;
    }
  }

  next();
};

export const requireProvider = (provider: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { User } = await import('../../models/user.model');
      const user = await User.findById(req.user.userId);

      if (!user || !user.providers.includes(provider)) {
        return res.status(403).json({
          message: `${provider} provider not linked to your account`,
          action: 'link_provider',
          provider,
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };
};

export const requireVerified = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { User } = await import('../../models/user.model');
    const user = await User.findById(req.user.userId);

    if (!user?.isVerified) {
      return res.status(403).json({ message: 'Email verification required' });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};