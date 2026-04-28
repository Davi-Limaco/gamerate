import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import jogosRoutes from './routes/jogos.js';
import avaliacoesRoutes from './routes/avaliacoes.js';
import usuariosRoutes from './routes/usuarios.js';
import miscRoutes from './routes/misc.js';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET não definido — usando valor padrão');
  process.env.JWT_SECRET = 'gamerate_dev_secret';
}
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não definida no .env');
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/jogos', jogosRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api', miscRoutes);

app.get('/api/diagnostico', async (req, res) => {
  const { default: pool } = await import('./db/connection.js');
  try {
    const r = await pool.query('SELECT NOW() as agora');
    res.json({
      ok: true,
      banco: r.rows[0].agora,
      database_url: process.env.DATABASE_URL ? 'definida' : 'NÃO DEFINIDA'
    });
  } catch (err) {
    res.json({
      ok: false,
      erro: err.message,
      database_url: process.env.DATABASE_URL ? 'definida' : 'NÃO DEFINIDA'
    });
  }
});

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api'))
    return res.status(404).json({ erro: 'Rota não encontrada' });

  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ GameRate rodando em http://localhost:${PORT}`);
  console.log(
    `   Banco: ${
      process.env.DATABASE_URL
        ? 'Supabase/PostgreSQL ✅'
        : '⚠️  DATABASE_URL não definida'
    }`
  );
});