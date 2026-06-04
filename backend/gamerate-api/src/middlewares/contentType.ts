/**
 * middlewares/contentType.ts — Middleware para garantir Content-Type
 */

import { Request, Response, NextFunction } from 'express';

export function contentTypeJson(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
}
