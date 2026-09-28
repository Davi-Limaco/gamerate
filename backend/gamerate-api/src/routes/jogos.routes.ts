import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { authorize } from '@/middlewares/authorize.ts';
import JogosController from '@/controllers/jogos.controller.ts';
import { idParamSchema } from '@/schemas/id-param.schema.ts';
import { jogoBodySchema, jogoUpdateBodySchema, jogoQuerySchema } from '@/schemas/jogo.schema.ts';

const router = Router();

// Catálogo de jogos é público (qualquer visitante navega e pesquisa).
router.get('/jogos/stats', JogosController.getStats);
router.get('/jogos/destaques', JogosController.getDestaques);
router.get('/jogos', validate({ query: jogoQuerySchema }), JogosController.read);
router.get('/jogos/:id', validate({ params: idParamSchema }), JogosController.readById);

// Cadastrar/editar/remover jogos é uma ação de gestão de catálogo, restrita
// a administradores (usada pelo painel admin.html).
router.post('/jogos', authenticate, authorize('Administrador'), requireJson, validate({ body: jogoBodySchema }), JogosController.create);
router.put('/jogos/:id', authenticate, authorize('Administrador'), requireJson, validate({ params: idParamSchema, body: jogoUpdateBodySchema }), JogosController.update);
router.delete('/jogos/:id', authenticate, authorize('Administrador'), validate({ params: idParamSchema }), JogosController.remove);

export default router;
