const router = require('express').Router();
const pool   = require('../db/connection');
const { authRequired, requirePerfil } = require('../middleware/auth');

router.get('/stats', async (req, res) => {
  try {
    const [[{ total_jogos }]]    = await pool.query('SELECT COUNT(*) AS total_jogos FROM jogo');
    const [[{ total_aval }]]     = await pool.query('SELECT COUNT(*) AS total_aval FROM avaliacao');
    const [[{ total_usuarios }]] = await pool.query('SELECT COUNT(*) AS total_usuarios FROM usuario');
    const [[{ total_plat }]]     = await pool.query('SELECT COUNT(*) AS total_plat FROM plataforma');
    res.json({ total_jogos, total_aval, total_usuarios, total_plat });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/destaques', async (req, res) => {
  try {
    const [lancamentos] = await pool.query(
      `SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento,
              nota_media, total_avaliacoes, capa
       FROM jogo ORDER BY data_lancamento DESC LIMIT 8`
    );
    const [melhores] = await pool.query(
      `SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento,
              nota_media, total_avaliacoes, capa
       FROM jogo WHERE nota_media IS NOT NULL
       ORDER BY nota_media DESC LIMIT 8`
    );
    res.json({ lancamentos, melhores });
  } catch (err) {
    console.error('destaques error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/', async (req, res) => {
  const {
    search, genero, plataforma,
    ordem = 'nota_media',
    dir   = 'DESC',
    page  = 1,
    limit = 20
  } = req.query;

  const ordens  = ['nota_media','total_avaliacoes','data_lancamento','nome_jogo'];
  const dirs    = ['ASC','DESC'];
  const safeOrd = ordens.includes(ordem) ? ordem : 'nota_media';
  const safeDir = dirs.includes(dir.toUpperCase()) ? dir.toUpperCase() : 'DESC';
  const offset  = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  let where  = 'WHERE 1=1';
  const params = [];

  if (search)    { where += ' AND j.nome_jogo LIKE ?';      params.push(`%${search}%`); }
  if (genero)    { where += ' AND g.nome_genero = ?';        params.push(genero); }
  if (plataforma){ where += ' AND pl.nome_plataforma = ?';   params.push(plataforma); }

  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT j.id_jogo, j.nome_jogo, j.desenvolvedora,
              j.data_lancamento, j.nota_media, j.total_avaliacoes, j.capa
       FROM jogo j
       LEFT JOIN jogo_genero    jg  ON jg.id_jogo_fk      = j.id_jogo
       LEFT JOIN genero         g   ON g.id_genero         = jg.id_genero_fk
       LEFT JOIN jogo_plataforma jp ON jp.id_jogo_fk       = j.id_jogo
       LEFT JOIN plataforma     pl  ON pl.id_plataforma    = jp.id_plataforma_fk
       ${where}
       ORDER BY CASE WHEN j.${safeOrd} IS NULL THEN 1 ELSE 0 END, j.${safeOrd} ${safeDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT j.id_jogo) AS total
       FROM jogo j
       LEFT JOIN jogo_genero    jg  ON jg.id_jogo_fk      = j.id_jogo
       LEFT JOIN genero         g   ON g.id_genero         = jg.id_genero_fk
       LEFT JOIN jogo_plataforma jp ON jp.id_jogo_fk       = j.id_jogo
       LEFT JOIN plataforma     pl  ON pl.id_plataforma    = jp.id_plataforma_fk
       ${where}`,
      params
    );

    res.json({ jogos: rows, total });
  } catch (err) {
    console.error('listagem error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[jogo]] = await pool.query(
      'SELECT * FROM jogo WHERE id_jogo = ?', [req.params.id]
    );
    if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado' });

    const [generos] = await pool.query(
      `SELECT g.nome_genero FROM genero g
       JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero
       WHERE jg.id_jogo_fk = ?`, [req.params.id]
    );
    const [plataformas] = await pool.query(
      `SELECT p.nome_plataforma FROM plataforma p
       JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma
       WHERE jp.id_jogo_fk = ?`, [req.params.id]
    );
    res.json({ ...jogo, generos, plataformas });
  } catch (err) {
    console.error('detalhe error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos = [], plataformas = [] } = req.body;
  if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao)
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, capa)
       VALUES (?, ?, ?, ?, ?)`,
      [nome_jogo, desenvolvedora, data_lancamento, descricao, capa || null]
    );
    const id = r.insertId;
    for (const gId of generos)
      await conn.query('INSERT INTO jogo_genero (id_jogo_fk, id_genero_fk) VALUES (?,?)', [id, gId]);
    for (const pId of plataformas)
      await conn.query('INSERT INTO jogo_plataforma (id_jogo_fk, id_plataforma_fk) VALUES (?,?)', [id, pId]);
    await conn.commit();
    res.status(201).json({ id_jogo: id });
  } catch (err) {
    await conn.rollback();
    console.error('cadastro jogo error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  } finally {
    conn.release();
  }
});

router.put('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { nome_jogo, desenvolvedora, data_lancamento, descricao, capa } = req.body;
  try {
    await pool.query(
      `UPDATE jogo SET nome_jogo=?, desenvolvedora=?, data_lancamento=?, descricao=?, capa=?
       WHERE id_jogo=?`,
      [nome_jogo, desenvolvedora, data_lancamento, descricao, capa, req.params.id]
    );
    res.json({ mensagem: 'Jogo atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    const [[{ cnt }]] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM avaliacao WHERE id_jogo_fk = ?', [req.params.id]
    );
    if (cnt > 0)
      return res.status(409).json({ erro: 'Jogo possui avaliações e não pode ser excluído' });

    await pool.query('DELETE FROM jogo_genero    WHERE id_jogo_fk = ?', [req.params.id]);
    await pool.query('DELETE FROM jogo_plataforma WHERE id_jogo_fk = ?', [req.params.id]);
    await pool.query('DELETE FROM jogo WHERE id_jogo = ?', [req.params.id]);
    res.json({ mensagem: 'Jogo excluído' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
