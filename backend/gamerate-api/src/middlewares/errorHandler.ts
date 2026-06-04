/**
 * middlewares/errorHandler.ts — Middleware de tratamento de erros
 */

import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(err);

  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  const status = err.status || 500;
  const message = err.message || 'Erro interno no servidor';

  res.status(status).json({ message });
}
