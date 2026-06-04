/**
 * routes.ts — Ponto central de registro de todas as rotas da API
 */

import { Router, Request, Response } from 'express';

import jogoRoutes from './routes/jogoRoutes.js';
import avaliacaoRoutes from './routes/avaliacaoRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import authRoutes from './routes/authRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import contatoRoutes from './routes/contatoRoutes.js';

const router = Router();

router.use('/jogos', jogoRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/auth', authRoutes);
router.use('/contato', contatoRoutes);

router.use('/', catalogRoutes);

// 404 — rota não encontrada
router.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

export default router;
