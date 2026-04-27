const router = require('express').Router();
const pool   = require('../db/connection');
const { authRequired, requirePerfil } = require('../middleware/auth');

// GET /api/jogos/stats
router.get('/stats', async (req, res) => {
  try {
    const [j, a, u, p] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM jogo'),
      pool.query('SELECT COUNT(*) AS total FROM avaliacao'),
      pool.query('SELECT COUNT(*) AS total FROM usuario'),
      pool.query('SELECT COUNT(*) AS total FROM plataforma'),
    ]);
    res.json({
      total_jogos:    parseInt(j.rows[0].total),
      total_aval:     parseInt(a.rows[0].total),
      total_usuarios: parseInt(u.rows[0].total),
      total_plat:     parseInt(p.rows[0].total),
    });
  } catch (err) {
    console.error('stats error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/jogos/destaques
router.get('/destaques', async (req, res) => {
  try {
    const [lanc, melh] = await Promise.all([
      pool.query(
        `SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento,
                nota_media, total_avaliacoes, capa
         FROM jogo ORDER BY data_lancamento DESC LIMIT 8`
      ),
      pool.query(
        `SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento,
                nota_media, total_avaliacoes, capa
         FROM jogo WHERE nota_media IS NOT NULL
         ORDER BY nota_media DESC LIMIT 8`
      ),
    ]);
    res.json({ lancamentos: lanc.rows, melhores: melh.rows });
  } catch (err) {
    console.error('destaques error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/jogos
router.get('/', async (req, res) => {
  const {
    search, genero, plataforma,
    ordem = 'nome_jogo', dir = 'ASC',
    page = 1, limit = 20
  } = req.query;

  const ordens  = ['nota_media','total_avaliacoes','data_lancamento','nome_jogo'];
  const dirs    = ['ASC','DESC'];
  const safeOrd = ordens.includes(ordem) ? ordem : 'nome_jogo';
  const safeDir = dirs.includes(dir.toUpperCase()) ? dir.toUpperCase() : 'ASC';
  const offset  = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const conditions = ['1=1'];
  const params     = [];
  let   idx        = 1;

  if (search)     { conditions.push(`j.nome_jogo ILIKE $${idx++}`);     params.push(`%${search}%`); }
  if (genero)     { conditions.push(`g.nome_genero = $${idx++}`);        params.push(genero); }
  if (plataforma) { conditions.push(`pl.nome_plataforma = $${idx++}`);   params.push(plataforma); }

  const where = 'WHERE ' + conditions.join(' AND ');

  try {
    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT DISTINCT j.id_jogo, j.nome_jogo, j.desenvolvedora,
                j.data_lancamento, j.nota_media, j.total_avaliacoes, j.capa
         FROM jogo j
         LEFT JOIN jogo_genero    jg  ON jg.id_jogo_fk      = j.id_jogo
         LEFT JOIN genero         g   ON g.id_genero         = jg.id_genero_fk
         LEFT JOIN jogo_plataforma jp ON jp.id_jogo_fk       = j.id_jogo
         LEFT JOIN plataforma     pl  ON pl.id_plataforma    = jp.id_plataforma_fk
         ${where}
         ORDER BY CASE WHEN j.${safeOrd} IS NULL THEN 1 ELSE 0 END, j.${safeOrd} ${safeDir}
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(limit), offset]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT j.id_jogo) AS total
         FROM jogo j
         LEFT JOIN jogo_genero    jg  ON jg.id_jogo_fk      = j.id_jogo
         LEFT JOIN genero         g   ON g.id_genero         = jg.id_genero_fk
         LEFT JOIN jogo_plataforma jp ON jp.id_jogo_fk       = j.id_jogo
         LEFT JOIN plataforma     pl  ON pl.id_plataforma    = jp.id_plataforma_fk
         ${where}`,
        params
      ),
    ]);
    res.json({ jogos: rows.rows, total: parseInt(cnt.rows[0].total) });
  } catch (err) {
    console.error('listagem error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/jogos/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM jogo WHERE id_jogo = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ erro: 'Jogo não encontrado' });
    const jogo = r.rows[0];

    const [gen, plat] = await Promise.all([
      pool.query(
        `SELECT g.nome_genero FROM genero g
         JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero
         WHERE jg.id_jogo_fk = $1`, [req.params.id]
      ),
      pool.query(
        `SELECT p.nome_plataforma FROM plataforma p
         JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma
         WHERE jp.id_jogo_fk = $1`, [req.params.id]
      ),
    ]);
    res.json({ ...jogo, generos: gen.rows, plataformas: plat.rows });
  } catch (err) {
    console.error('detalhe error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/jogos
router.post('/', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos = [], plataformas = [] } = req.body;
  if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao)
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, capa)
       VALUES ($1,$2,$3,$4,$5) RETURNING id_jogo`,
      [nome_jogo, desenvolvedora, data_lancamento, descricao, capa || null]
    );
    const id = r.rows[0].id_jogo;
    for (const gId of generos)
      await client.query('INSERT INTO jogo_genero (id_jogo_fk, id_genero_fk) VALUES ($1,$2)', [id, gId]);
    for (const pId of plataformas)
      await client.query('INSERT INTO jogo_plataforma (id_jogo_fk, id_plataforma_fk) VALUES ($1,$2)', [id, pId]);
    await client.query('COMMIT');
    res.status(201).json({ id_jogo: id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  } finally {
    client.release();
  }
});

// PUT /api/jogos/:id
router.put('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { nome_jogo, desenvolvedora, data_lancamento, descricao, capa } = req.body;
  try {
    await pool.query(
      `UPDATE jogo SET nome_jogo=$1, desenvolvedora=$2, data_lancamento=$3, descricao=$4, capa=$5
       WHERE id_jogo=$6`,
      [nome_jogo, desenvolvedora, data_lancamento, descricao, capa, req.params.id]
    );
    res.json({ mensagem: 'Jogo atualizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/jogos/:id
router.delete('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    const cnt = await pool.query(
      'SELECT COUNT(*) AS total FROM avaliacao WHERE id_jogo_fk = $1', [req.params.id]
    );
    if (parseInt(cnt.rows[0].total) > 0)
      return res.status(409).json({ erro: 'Jogo possui avaliações e não pode ser excluído' });
    await pool.query('DELETE FROM jogo WHERE id_jogo = $1', [req.params.id]);
    res.json({ mensagem: 'Jogo excluído' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
