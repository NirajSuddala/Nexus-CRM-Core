import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isDatabaseConnected } from '../config/database';
import { UserRole } from '../models/User';

export { UserRole };

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        fullName: string;
      };
    }
  }
}

// Demo user for when database is not connected
const DEMO_USER: {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
} = {
  id: 'demo-user-id',
  email: 'demo@nexuscrm.com',
  role: 'admin',
  fullName: 'Demo User',
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Demo mode - skip authentication when database is not connected
  if (!isDatabaseConnected) {
    req.user = DEMO_USER;
    next();
    return;
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    // Dynamically import User model only when database is connected
    const { User } = await import('../models');
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const generateToken = (user: { id: string; email: string; role: UserRole }): string => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' } as jwt.SignOptions
  );
};

export const generateRefreshToken = (user: { id: string }): string => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' } as jwt.SignOptions
  );
};
