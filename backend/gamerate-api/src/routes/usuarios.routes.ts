import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import UsuariosController from '@/controllers/usuarios.controller.ts';

const router = Router();

router.get('/usuarios/me', isAuthenticated, UsuariosController.me);
router.get('/usuarios', isAuthenticated, UsuariosController.read);
router.get('/usuarios/:id', isAuthenticated, UsuariosController.readById);
router.get('/usuarios/:id/avaliacoes', isAuthenticated, UsuariosController.readAvaliacoes);
router.post('/usuarios', requireJson, UsuariosController.create);
router.put('/usuarios/:id', isAuthenticated, requireJson, UsuariosController.update);
router.put('/usuarios/:id/perfil', isAuthenticated, requireJson, UsuariosController.updatePerfil);
router.delete('/usuarios/:id', isAuthenticated, UsuariosController.remove);

export default router;
