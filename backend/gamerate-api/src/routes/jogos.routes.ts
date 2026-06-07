import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.js';
import { Router } from 'express';
import JogosController from '@/controllers/jogos.controller.js';

const router = Router();

router.get('/jogos/stats',     JogosController.getStats);
router.get('/jogos/destaques', JogosController.getDestaques);
router.get('/jogos',           JogosController.read);
router.get('/jogos/:id',       JogosController.readById);
router.post('/jogos',          requireJson, JogosController.create);
router.put('/jogos/:id',       requireJson, JogosController.update);
router.delete('/jogos/:id',    JogosController.remove);

export default router;
