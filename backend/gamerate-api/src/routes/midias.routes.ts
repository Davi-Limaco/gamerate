import { Router } from 'express';

import MidiasController from '@/controllers/midias.controller.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { requireMidiaOwnerOrAdmin } from '@/middlewares/requireMidiaOwnerOrAdmin.ts';
import { uploadMidia } from '@/middlewares/uploadMidia.ts';
import { validate } from '@/middlewares/validate.ts';
import { idParamSchema } from '@/schemas/id-param.schema.ts';
import { midiaBodySchema, midiaQuerySchema, midiaUpdateBodySchema } from '@/schemas/midia.schema.ts';

const router = Router();

// Leitura pública (galeria de gameplays), com filtros validados na query.
router.get('/midias', validate({ query: midiaQuerySchema }), MidiasController.read);
router.get('/midias/:id', validate({ params: idParamSchema }), MidiasController.readById);

// Postar: authenticate -> Multer (arquivo + campos de texto) -> validate (texto)
// -> Controller. Sem token = 401 sem processar o arquivo; campos inválidos = 400
// e o arquivo já gravado é apagado pelo middleware de erros.
router.post('/midias', authenticate, uploadMidia, validate({ body: midiaBodySchema }), MidiasController.create);

router.put(
  '/midias/:id',
  authenticate,
  requireJson,
  validate({ params: idParamSchema, body: midiaUpdateBodySchema }),
  requireMidiaOwnerOrAdmin,
  MidiasController.update,
);
router.delete(
  '/midias/:id',
  authenticate,
  validate({ params: idParamSchema }),
  requireMidiaOwnerOrAdmin,
  MidiasController.remove,
);

export default router;
