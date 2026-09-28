import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import { validate } from '@/middlewares/validate.ts';
import {
  readAvaliacoesSchema,
  readAvaliacaoByIdSchema,
  createAvaliacaoSchema,
  updateAvaliacaoSchema,
  idSchema,
} from '@/schemas/index.ts';
import AvaliacoesController from '@/controllers/avaliacoes.controller.ts';

const router = Router();

router.get('/avaliacoes/destaque', AvaliacoesController.getDestaque);
router.get('/avaliacoes', validate(readAvaliacoesSchema), AvaliacoesController.read);
router.get('/avaliacoes/:id', validate(readAvaliacaoByIdSchema), AvaliacoesController.readById);
router.post('/avaliacoes', isAuthenticated, requireJson, validate(createAvaliacaoSchema), AvaliacoesController.create);
router.put('/avaliacoes/:id', isAuthenticated, requireJson, validate(updateAvaliacaoSchema), AvaliacoesController.update);
router.delete('/avaliacoes/:id', isAuthenticated, validate(idSchema), AvaliacoesController.remove);

export default router;
