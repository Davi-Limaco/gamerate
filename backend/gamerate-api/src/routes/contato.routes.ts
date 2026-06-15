import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import ContatoController from '@/controllers/contato.controller.ts';

const router = Router();

router.get('/contato',       ContatoController.read);
router.post('/contato',      requireJson, ContatoController.create);
router.delete('/contato/:id', ContatoController.remove);

export default router;
