import type { Request, Response, NextFunction } from 'express';

import HttpError from '@/errors/HttpError.ts';

export const requireJsonContentType = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.headers['content-type'] !== 'application/json') {
    throw new HttpError('Content-Type must be application/json');
  }

  next();
};
