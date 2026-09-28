import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import { validate } from '@/middlewares/validate.ts';
import {
  readJogoSchema,
  readJogoByIdSchema,
  createJogoSchema,
  updateJogoSchema,
  idSchema,
} from '@/schemas/index.ts';
import JogosController from '@/controllers/jogos.controller.ts';

const router = Router();

router.get('/jogos/stats', JogosController.getStats);
router.get('/jogos/destaques', JogosController.getDestaques);
router.get('/jogos', validate(readJogoSchema), JogosController.read);
router.get('/jogos/:id', validate(readJogoByIdSchema), JogosController.readById);
router.post('/jogos', isAuthenticated, requireJson, validate(createJogoSchema), JogosController.create);
router.put('/jogos/:id', isAuthenticated, requireJson, validate(updateJogoSchema), JogosController.update);
router.delete('/jogos/:id', isAuthenticated, validate(idSchema), JogosController.remove);

export default router;
