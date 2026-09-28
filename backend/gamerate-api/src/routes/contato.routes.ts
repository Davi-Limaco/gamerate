import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { authorize } from '@/middlewares/authorize.ts';
import ContatoController from '@/controllers/contato.controller.ts';
import { idParamSchema } from '@/schemas/id-param.schema.ts';
import { contatoBodySchema } from '@/schemas/contato.schema.ts';

const router = Router();

// Enviar uma mensagem de contato é uma ação pública (formulário de "Fale
// conosco", acessível sem login). Ler e remover as mensagens recebidas é
// restrito a administradores (painel admin.html).
router.post('/contato', requireJson, validate({ body: contatoBodySchema }), ContatoController.create);
router.get('/contato', authenticate, authorize('Administrador'), ContatoController.read);
router.delete('/contato/:id', authenticate, authorize('Administrador'), validate({ params: idParamSchema }), ContatoController.remove);

export default router;
