import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController.js';

const router = Router();

router.get('/',    UsuarioController.getAll);
router.get('/:id', UsuarioController.getById);
router.get('/:id/avaliacoes', UsuarioController.getAvaliacoes);
router.post('/',   UsuarioController.create);
router.put('/:id', UsuarioController.update);
router.put('/:id/perfil', UsuarioController.updatePerfil);
router.delete('/:id', UsuarioController.remove);

export default router;
