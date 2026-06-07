import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.js';
import { Router } from 'express';
import ContatoController from '@/controllers/contato.controller.js';

const router = Router();

router.get('/contato',       ContatoController.read);
router.post('/contato',      requireJson, ContatoController.create);
router.delete('/contato/:id', ContatoController.remove);

export default router;
