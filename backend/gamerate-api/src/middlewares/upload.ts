import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import HttpError from '@/errors/HttpError.ts';
import {
  ALLOWED_MIME_TYPES,
  AVATAR_DIR,
  MAX_UPLOAD_BYTES,
  ensureUploadDirs,
  hasImageSignature,
  removeFileQuietly,
} from '@/utils/uploads.ts';

// Cria uploads/avatars se ainda não existir (clone novo, pasta fora do git).
ensureUploadDirs();

/**
 * Destino em disco + nome gerado PELO SERVIDOR.
 *
 * `file.originalname` (nome enviado pelo cliente) é ignorado de propósito:
 * ele poderia conter `../`, extensões enganosas ou colidir com o arquivo de
 * outro usuário. O nome final é um UUID aleatório + extensão obtida da
 * allowlist de MIME — sem colisão, sem sobrescrita e sem caminho malicioso.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => {
    const extensao = ALLOWED_MIME_TYPES[file.mimetype];
    cb(null, `${randomUUID()}${extensao}`);
  },
});

/**
 * Filtro por tipo MIME (lista permitida). Roda ANTES de o Multer abrir o
 * arquivo de destino: ao recusar, nenhum byte é gravado em disco e o erro
 * (HttpError 400) segue direto para o middleware de erros da aplicação.
 */
function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (Object.hasOwn(ALLOWED_MIME_TYPES, file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new HttpError('Tipo de arquivo não permitido. Envie uma imagem JPEG, PNG ou GIF.', 400));
}

const multerAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_BYTES, // excedeu -> MulterError LIMIT_FILE_SIZE (vira 400)
    files: 1,                   // um arquivo por requisição
    fields: 0,                  // o avatar não precisa de campos de texto
  },
}).single('imagem'); // nome do campo multipart esperado: "imagem"

/**
 * Middleware de upload da foto de perfil (campo multipart `imagem`).
 *
 * Deve ser usado SEMPRE depois de `authenticate`, para que uma requisição sem
 * token receba 401 antes de o corpo multipart ser processado.
 *
 * Além do filtro de MIME (declarado pelo cliente), confere os primeiros bytes
 * do arquivo já gravado: se o conteúdo não for de fato JPEG/PNG/GIF, o arquivo
 * é apagado e a resposta é 400 — impede, por exemplo, um .html renomeado com
 * `Content-Type: image/png`.
 */
export function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  multerAvatar(req, res, async (error?: unknown) => {
    // Erros do Multer (tamanho, campo inesperado...) e do filtro (HttpError)
    // seguem para o errorHandler; o Multer já descarta arquivos parciais.
    if (error) return next(error);

    if (!req.file) {
      return next(new HttpError('Nenhum arquivo enviado. Envie uma imagem no campo "imagem" (multipart/form-data).', 400));
    }

    try {
      if (!(await hasImageSignature(req.file.path))) {
        await removeFileQuietly(req.file.path);
        return next(new HttpError('O conteúdo do arquivo não é uma imagem válida (JPEG, PNG ou GIF).', 400));
      }
      next();
    } catch (err) {
      await removeFileQuietly(req.file.path);
      next(err);
    }
  });
}
