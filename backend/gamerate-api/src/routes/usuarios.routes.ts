import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.js';
import { Router } from 'express';
import UsuariosController from '@/controllers/usuarios.controller.js';

const router = Router();

router.get('/usuarios',               UsuariosController.read);
router.get('/usuarios/:id',           UsuariosController.readById);
router.get('/usuarios/:id/avaliacoes', UsuariosController.readAvaliacoes);
router.post('/usuarios',              requireJson, UsuariosController.create);
router.put('/usuarios/:id',           requireJson, UsuariosController.update);
router.put('/usuarios/:id/perfil',    requireJson, UsuariosController.updatePerfil);
router.delete('/usuarios/:id',        UsuariosController.remove);

export default router;
