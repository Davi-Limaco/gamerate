import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import ContatoController from '@/controllers/contato.controller.ts';

const router = Router();

router.get('/contato',       isAuthenticated, ContatoController.read);
router.post('/contato',      requireJson, ContatoController.create);
router.delete('/contato/:id', isAuthenticated, ContatoController.remove);

export default router;
