/**
 * routes/contatoRoutes.ts
 */

import { Router } from 'express';
import ContatoController from '../controllers/ContatoController.js';

const router = Router();

router.get('/', ContatoController.getAll);
router.post('/', ContatoController.create);
router.delete('/:id', ContatoController.remove);

export default router;
