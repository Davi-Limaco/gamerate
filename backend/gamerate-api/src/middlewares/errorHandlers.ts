import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

import HttpError from '@/errors/HttpError.ts';
import { MAX_UPLOAD_BYTES } from '@/utils/uploads.ts';

/** Traduz erros do Multer (limites do upload) para mensagens claras em pt-BR. */
function multerMessage(err: multer.MulterError): string {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return `Arquivo muito grande. O tamanho máximo é ${(MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0)} MB.`;
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Campo de arquivo inesperado. Envie uma única imagem no campo "imagem".';
    case 'LIMIT_FILE_COUNT':
      return 'Envie apenas um arquivo por requisição.';
    default:
      return `Falha no envio do arquivo (${err.code}).`;
  }
}

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

  // Erros de upload (tamanho excedido, campo inesperado...) são falha do
  // cliente -> 400. O Multer já descartou qualquer arquivo parcial do disco.
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: multerMessage(err), code: err.code });
  }

  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
};
