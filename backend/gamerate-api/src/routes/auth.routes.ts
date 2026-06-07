import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.js';
import { Router } from 'express';
import UsuariosController from '@/controllers/usuarios.controller.js';

const router = Router();

router.post('/auth/login',    requireJson, UsuariosController.login);
router.post('/auth/cadastro', requireJson, UsuariosController.cadastro);

export default router;
