/**
 * routes/jogoRoutes.ts
 */

import { Router } from 'express';
import JogoController from '../controllers/JogoController.js';

const router = Router();

router.get('/stats', JogoController.getStats);
router.get('/destaques', JogoController.getDestaques);

router.get('/', JogoController.getAll);
router.get('/:id', JogoController.getById);
router.post('/', JogoController.create);
router.put('/:id', JogoController.update);
router.delete('/:id', JogoController.remove);

export default router;
