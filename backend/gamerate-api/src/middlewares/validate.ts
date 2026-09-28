import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

import HttpError from '@/errors/HttpError.ts';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

/**
 * Middleware genérico de validação.
 *
 * Recebe um conjunto de schemas Zod (body, params e/ou query), faz o parse de
 * cada fonte de entrada da requisição e, em caso de sucesso, substitui
 * req.body/req.params/req.query pelos dados já validados e com os tipos e
 * coerções aplicados pelo schema (ex.: string -> number em params/query).
 *
 * Se qualquer schema falhar, a validação é interrompida e o erro é repassado
 * para o middleware de erros central (errorHandlers.ts) como um HttpError 400
 * com a lista de issues — Controllers e Models nunca precisam repetir
 * verificações manuais de formato/obrigatoriedade.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        Object.defineProperty(req, 'query', {
          value: schemas.query.parse(req.query),
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          path: issue.path.join('.') || '(raiz)',
          message: issue.message,
        }));
        return next(new HttpError('Dados inválidos na requisição', 400, issues));
      }
      next(error);
    }
  };
}
