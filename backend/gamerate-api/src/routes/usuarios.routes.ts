import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import UsuariosController from '@/controllers/usuarios.controller.ts';

const router = Router();

router.get('/usuarios',               UsuariosController.read);
router.get('/usuarios/:id',           UsuariosController.readById);
router.get('/usuarios/:id/avaliacoes', UsuariosController.readAvaliacoes);
router.post('/usuarios',              requireJson, UsuariosController.create);
router.put('/usuarios/:id',           requireJson, UsuariosController.update);
router.put('/usuarios/:id/perfil',    requireJson, UsuariosController.updatePerfil);
router.delete('/usuarios/:id',        UsuariosController.remove);

export default router;
