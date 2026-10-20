import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    const user = await User.findById(decoded.id).select('_id email fullName status');

    if (!user || user.status === 'suspended') {
      res.status(401).json({ success: false, message: 'Session expired or user invalid.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}
