import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.js';
import { Router } from 'express';
import AvaliacoesController from '@/controllers/avaliacoes.controller.js';

const router = Router();

router.get('/avaliacoes/destaque', AvaliacoesController.getDestaque);
router.get('/avaliacoes',          AvaliacoesController.read);
router.get('/avaliacoes/:id',      AvaliacoesController.readById);
router.post('/avaliacoes',         requireJson, AvaliacoesController.create);
router.put('/avaliacoes/:id',      requireJson, AvaliacoesController.update);
router.delete('/avaliacoes/:id',   AvaliacoesController.remove);

export default router;
