import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import { validate } from '@/middlewares/validate.ts';
import {
  readUsuarioByIdSchema,
  readUsuarioAvaliacoesSchema,
  createUsuarioSchema,
  updateUsuarioSchema,
  updatePerfilSchema,
  removeUsuarioSchema,
} from '@/schemas/index.ts';
import UsuariosController from '@/controllers/usuarios.controller.ts';

const router = Router();

router.get('/usuarios/me', isAuthenticated, UsuariosController.me);
router.get('/usuarios', isAuthenticated, UsuariosController.read);
router.get('/usuarios/:id', isAuthenticated, validate(readUsuarioByIdSchema), UsuariosController.readById);
router.get('/usuarios/:id/avaliacoes', isAuthenticated, validate(readUsuarioAvaliacoesSchema), UsuariosController.readAvaliacoes);
router.post('/usuarios', requireJson, validate(createUsuarioSchema), UsuariosController.create);
router.put('/usuarios/:id', isAuthenticated, requireJson, validate(updateUsuarioSchema), UsuariosController.update);
router.put('/usuarios/:id/perfil', isAuthenticated, requireJson, validate(updatePerfilSchema), UsuariosController.updatePerfil);
router.delete('/usuarios/:id', isAuthenticated, validate(removeUsuarioSchema), UsuariosController.remove);

export default router;
