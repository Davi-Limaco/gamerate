import type { Request, Response, NextFunction } from 'express';

import HttpError from '@/errors/HttpError.ts';

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(404).json({ error: 'Content Not Found' });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    return res.status(err.code).json({ error: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
};
