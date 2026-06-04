/**
 * routes/authRoutes.ts
 */

import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController.js';

const router = Router();

router.post('/login', UsuarioController.login);
router.post('/cadastro', UsuarioController.cadastro);

export default router;
