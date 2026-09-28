import type { NextFunction, Request, Response } from 'express';
import { z, type ZodTypeAny } from 'zod';

export function validate<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      }) as Record<string, any>;

      if (result.body !== undefined) {
        req.body = result.body;
      }

      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.flatten(),
        });
      }

      return next(error);
    }
  };
}
