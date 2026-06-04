/**
 * routes.ts — Ponto central de registro de todas as rotas da API
**/
import { Router } from 'express';
import jogoRoutes from '@/routes/jogoRoutes';
import avaliacaoRoutes from '@/routes/avaliacaoRoutes';
import usuarioRoutes from '@/routes/usuarioRoutes';
import authRoutes from '@/routes/authRoutes';
import catalogRoutes from '@/routes/catalogRoutes';
import contatoRoutes from '@/routes/contatoRoutes';
const router = Router();
router.use('/jogos', jogoRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/auth', authRoutes);
router.use('/contato', contatoRoutes);
// Gêneros, Plataformas e Perfis são montados na raiz do router
// pois cada um tem seu próprio prefixo definido dentro de catalogRoutes
router.use('/', catalogRoutes);
// 404 — rota não encontrada
router.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
});
export default router;
