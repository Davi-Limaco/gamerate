import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import UsuariosController from '@/controllers/usuarios.controller.ts';

const router = Router();

router.post('/auth/login',    requireJson, UsuariosController.login);
router.post('/auth/cadastro', requireJson, UsuariosController.cadastro);

export default router;
