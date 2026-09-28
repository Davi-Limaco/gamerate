import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import AuthController from '@/controllers/auth.controller.ts';
import { loginBodySchema, cadastroBodySchema } from '@/schemas/usuario.schema.ts';

const router = Router();

// Rotas públicas: qualquer visitante pode se cadastrar ou autenticar.
router.post('/auth/login', requireJson, validate({ body: loginBodySchema }), AuthController.login);
router.post('/auth/cadastro', requireJson, validate({ body: cadastroBodySchema }), AuthController.cadastro);

// Rota protegida de exemplo: exige um JWT válido no header Authorization.
// Sem token (ou com token inválido/expirado) -> 401, antes mesmo de chegar
// ao Controller. Usada pelo front-end para restaurar/validar a sessão salva.
router.get('/auth/me', authenticate, AuthController.me);

export default router;
