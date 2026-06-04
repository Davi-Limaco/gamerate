/**
 * routes/avaliacaoRoutes.ts
 */

import { Router } from 'express';
import AvaliacaoController from '../controllers/AvaliacaoController.js';

const router = Router();

router.get('/destaque', AvaliacaoController.getDestaque);

router.get('/', AvaliacaoController.getAll);
router.get('/:id', AvaliacaoController.getById);
router.post('/', AvaliacaoController.create);
router.put('/:id', AvaliacaoController.update);
router.delete('/:id', AvaliacaoController.remove);

export default router;
