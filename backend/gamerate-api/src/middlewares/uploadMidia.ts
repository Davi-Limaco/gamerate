import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import HttpError from '@/errors/HttpError.ts';
import {
  ALLOWED_MIDIA_TYPES,
  MAX_MIDIA_BYTES,
  MIDIA_DIR,
  detectMediaKind,
  ensureUploadDirs,
  removeFileQuietly,
} from '@/utils/uploads.ts';

ensureUploadDirs();

/**
 * Prints e vídeos de gameplay: mesmo desenho do upload de avatar — destino em
 * disco, nome gerado pelo servidor (UUID + extensão da allowlist), limite de
 * tamanho e filtro de MIME rodando ANTES de qualquer byte ser gravado.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MIDIA_DIR),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED_MIDIA_TYPES[file.mimetype]!.extensao}`),
});

const multerMidia = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (Object.hasOwn(ALLOWED_MIDIA_TYPES, file.mimetype)) return cb(null, true);
    cb(new HttpError('Tipo de arquivo não permitido. Envie uma imagem (JPEG, PNG, GIF, WebP) ou um vídeo (MP4, WebM).', 400));
  },
  limits: {
    fileSize: MAX_MIDIA_BYTES,
    files: 1,
    fields: 3,          // titulo, descricao, id_jogo_fk
    fieldSize: 4 * 1024, // nenhum campo de texto passa de 4 KB
  },
}).single('arquivo'); // nome do campo multipart: "arquivo"

/**
 * Recebe o multipart de uma mídia (campo `arquivo` + campos de texto).
 * Deve vir DEPOIS de `authenticate` e ANTES de `validate({ body })`, porque os
 * campos de texto só existem em `req.body` depois que o Multer os lê.
 *
 * Confere também o conteúdo real do arquivo (magic bytes): o MIME declarado é
 * informado pelo cliente. Se o conteúdo não corresponder ao tipo declarado
 * (ex.: um .html enviado como `video/mp4`), o arquivo é apagado e a resposta é 400.
 */
export function uploadMidia(req: Request, res: Response, next: NextFunction) {
  multerMidia(req, res, async (error?: unknown) => {
    if (error) return next(error);

    if (!req.file) {
      return next(new HttpError('Nenhum arquivo enviado. Envie uma imagem ou vídeo no campo "arquivo" (multipart/form-data).', 400));
    }

    try {
      const declarado = ALLOWED_MIDIA_TYPES[req.file.mimetype]!.tipo;
      const real = await detectMediaKind(req.file.path);
      if (real !== declarado) {
        await removeFileQuietly(req.file.path);
        return next(new HttpError('O conteúdo do arquivo não corresponde a uma imagem ou vídeo válido.', 400));
      }
      res.locals.tipoMidia = declarado;
      next();
    } catch (err) {
      await removeFileQuietly(req.file.path);
      next(err);
    }
  });
}
