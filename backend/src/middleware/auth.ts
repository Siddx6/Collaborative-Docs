import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';

// Required authentication
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional authentication - allows request through even without token
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, but that's okay - continue without user
      req.user = undefined;
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Invalid token, but don't block the request
      req.user = undefined;
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};