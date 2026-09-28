import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { loginSchema, cadastroSchema } from '@/schemas/index.ts';
import UsuariosController from '@/controllers/usuarios.controller.ts';

const router = Router();

router.post('/auth/login', requireJson, validate(loginSchema), UsuariosController.login);
router.post('/auth/cadastro', requireJson, validate(cadastroSchema), UsuariosController.cadastro);

export default router;
