/**
 * routes.js — Ponto central de registro de todas as rotas da API
**/

import { Router } from 'express';

import jogoRoutes      from './routes/jogoRoutes.js';
import avaliacaoRoutes from './routes/avaliacaoRoutes.js';
import usuarioRoutes   from './routes/usuarioRoutes.js';
import authRoutes      from './routes/authRoutes.js';
import catalogRoutes   from './routes/catalogRoutes.js';
import contatoRoutes   from './routes/contatoRoutes.js';

const router = Router();

router.use('/jogos',      jogoRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/usuarios',   usuarioRoutes);
router.use('/auth',       authRoutes);
router.use('/contato',    contatoRoutes);

// Gêneros, Plataformas e Perfis são montados na raiz do router
// pois cada um tem seu próprio prefixo definido dentro de catalogRoutes
router.use('/', catalogRoutes);

// 404 — rota não encontrada
router.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Handler global de erros
router.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.code || 500;
  res.status(status).json({ message: err.message || 'Erro interno no servidor.' });
});

export default router;
