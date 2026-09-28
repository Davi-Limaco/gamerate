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
    // Quando o erro vem do middleware de validação (validate + Zod), issues
    // traz a lista de campos que falharam ({ path, message }) para o cliente
    // saber exatamente o que corrigir.
    return res.status(err.code).json({
      error: err.message,
      ...(err.issues ? { issues: err.issues } : {}),
    });
  }

  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
};
