require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

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

// Rotas API
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/jogos',      require('./routes/jogos'));
app.use('/api/avaliacoes', require('./routes/avaliacoes'));
app.use('/api/usuarios',   require('./routes/usuarios'));
app.use('/api',            require('./routes/misc'));

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Frontend estático
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
  console.log(`   Banco: ${process.env.DATABASE_URL ? 'Supabase/PostgreSQL ✅' : '⚠️  DATABASE_URL não definida'}`);
});
