import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { requireAvaliacaoOwnerOrAdmin } from '@/middlewares/requireAvaliacaoOwnerOrAdmin.ts';
import AvaliacoesController from '@/controllers/avaliacoes.controller.ts';
import { idParamSchema } from '@/schemas/id-param.schema.ts';
import { avaliacaoBodySchema, avaliacaoUpdateBodySchema, avaliacaoQuerySchema } from '@/schemas/avaliacao.schema.ts';

const router = Router();

// Leitura de avaliações é pública: qualquer visitante pode ver as reviews de
// um jogo sem estar logado.
router.get('/avaliacoes/destaque', AvaliacoesController.getDestaque);
router.get('/avaliacoes', validate({ query: avaliacaoQuerySchema }), AvaliacoesController.read);
router.get('/avaliacoes/:id', validate({ params: idParamSchema }), AvaliacoesController.readById);

// Publicar uma avaliação é a funcionalidade protegida "principal" do
// projeto: exige um JWT válido (authenticate) e usa req.usuario.id como
// autor — sem token, 401 antes de qualquer escrita no banco.
router.post('/avaliacoes', authenticate, requireJson, validate({ body: avaliacaoBodySchema }), AvaliacoesController.create);

// Editar/remover uma avaliação: além de autenticado, precisa ser o autor
// original ou um Administrador (moderação, usada em admin.html).
router.put(
  '/avaliacoes/:id',
  authenticate,
  requireJson,
  validate({ params: idParamSchema, body: avaliacaoUpdateBodySchema }),
  requireAvaliacaoOwnerOrAdmin,
  AvaliacoesController.update,
);
router.delete(
  '/avaliacoes/:id',
  authenticate,
  validate({ params: idParamSchema }),
  requireAvaliacaoOwnerOrAdmin,
  AvaliacoesController.remove,
);

export default router;
