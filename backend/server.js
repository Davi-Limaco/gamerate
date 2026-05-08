require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { errorMiddleware } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET não definido — usando valor padrão');
  process.env.JWT_SECRET = 'gamerate_dev_secret';
}
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida — configure no Render Environment Variables');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// ── Rotas API ─────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/jogos',      require('./routes/jogos'));
app.use('/api/avaliacoes', require('./routes/avaliacoes'));
app.use('/api/usuarios',   require('./routes/usuarios'));
app.use('/api',            require('./routes/misc'));

// ── Utilitários ───────────────────────────────────────────────
app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.get('/api/diagnostico', async (req, res) => {
  const pool = require('./db/connection');
  try {
    const r = await pool.query('SELECT NOW() as agora, current_database() as db');
    res.json({ ok: true, agora: r.rows[0].agora, banco: r.rows[0].db });
  } catch (err) {
    res.json({ ok: false, erro: err.message });
  }
});

// ── Frontend estático ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api'))
    return res.status(404).json({ erro: 'Rota não encontrada' });
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Middleware de erro global (deve ser o último) ─────────────
app.use(errorMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ GameRate rodando na porta ${PORT}`);
  console.log(`   Banco: Supabase/PostgreSQL ✅`);
});
