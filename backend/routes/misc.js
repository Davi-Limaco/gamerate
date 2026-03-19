const router = require('express').Router();
const pool   = require('../db/connection');
const { authRequired, requirePerfil } = require('../middleware/auth');

router.post('/contato', async (req, res) => {
  const { email_contato, tipo, mensagem } = req.body;
  if (!email_contato || !tipo || !mensagem)
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  try {
    await pool.query(
      `INSERT INTO comunicacao_site (email_contato, tipo, mensagem, data_comunicacao)
       VALUES (?, ?, ?, CURDATE())`,
      [email_contato, tipo, mensagem]
    );
    res.status(201).json({ mensagem: 'Mensagem enviada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/contato', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM comunicacao_site ORDER BY data_comunicacao DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/generos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.id_genero, g.nome_genero, COUNT(jg.id_jogo_fk) AS total_jogos
       FROM genero g
       LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero
       GROUP BY g.id_genero ORDER BY total_jogos DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/plataformas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id_plataforma, p.nome_plataforma, COUNT(jp.id_jogo_fk) AS total_jogos
       FROM plataforma p
       LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma
       GROUP BY p.id_plataforma ORDER BY total_jogos DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
