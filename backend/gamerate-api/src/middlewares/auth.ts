import type { Request, Response, NextFunction } from 'express';

import { verifyJwt } from '@/utils/jwt.ts';

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;
    const [, token] = authorization?.split(' ') ?? [];

    if (!token) {
      return res.status(401).json({ auth: false, message: 'Token required.' });
    }

    const payload = verifyJwt(token);
    req.userId = payload.userId;

    return next();
  } catch (error) {
    return res.status(401).json({ auth: false, message: 'Token invalid.' });
  }
}
