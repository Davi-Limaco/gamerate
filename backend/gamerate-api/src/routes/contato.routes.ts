import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import { validate } from '@/middlewares/validate.ts';
import { createContatoSchema, removeContatoSchema } from '@/schemas/index.ts';
import ContatoController from '@/controllers/contato.controller.ts';

const router = Router();

router.get('/contato', isAuthenticated, ContatoController.read);
router.post('/contato', requireJson, validate(createContatoSchema), ContatoController.create);
router.delete('/contato/:id', isAuthenticated, validate(removeContatoSchema), ContatoController.remove);

export default router;
