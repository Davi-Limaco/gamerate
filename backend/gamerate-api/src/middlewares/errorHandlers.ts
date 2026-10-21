import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

import HttpError from '@/errors/HttpError.ts';
import { MAX_MIDIA_BYTES, MAX_UPLOAD_BYTES, removeFileQuietly } from '@/utils/uploads.ts';

/** Traduz erros do Multer (limites do upload) para mensagens claras em pt-BR. */
function multerMessage(err: multer.MulterError): string {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE': {
      // O campo "arquivo" é o das mídias de gameplay; "imagem" é o da foto de perfil.
      const limite = err.field === 'arquivo' ? MAX_MIDIA_BYTES : MAX_UPLOAD_BYTES;
      return `Arquivo muito grande. O tamanho máximo é ${(limite / (1024 * 1024)).toFixed(0)} MB.`;
    }
    case 'LIMIT_FIELD_COUNT':
    case 'LIMIT_FIELD_VALUE':
    case 'LIMIT_FIELD_KEY':
      return 'Campos do formulário inválidos ou em excesso.';
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Campo de arquivo inesperado. Confira o nome do campo do arquivo no formulário.';
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
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Qualquer erro depois do Multer (validação de campos, regra de negócio,
  // banco...) deixaria o arquivo recém-gravado órfão: apagamos aqui, em um
  // único lugar, em vez de repetir a limpeza em cada controller.
  if (req.file) void removeFileQuietly(req.file.path);

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
