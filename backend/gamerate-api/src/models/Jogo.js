import Database from '../database/database.js';

// Retorna lista de jogos com filtros opcionais de busca, gênero e plataforma
async function readAll({ search, genero, plataforma } = {}) {
  const db = await Database.connect();

  const conditions = [];
  const params     = [];

  if (search)     { conditions.push(`j.nome_jogo LIKE ?`);    params.push(`%${search}%`); }
  if (genero)     { conditions.push(`g.nome_genero = ?`);     params.push(genero); }
  if (plataforma) { conditions.push(`pl.nome_plataforma = ?`); params.push(plataforma); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT DISTINCT j.id_jogo, j.nome_jogo, j.desenvolvedora,
                    j.data_lancamento, j.nota_media, j.total_avaliacoes, j.capa
    FROM jogo j
    LEFT JOIN jogo_genero     jg ON jg.id_jogo_fk      = j.id_jogo
    LEFT JOIN genero          g  ON g.id_genero         = jg.id_genero_fk
    LEFT JOIN jogo_plataforma jp ON jp.id_jogo_fk       = j.id_jogo
    LEFT JOIN plataforma      pl ON pl.id_plataforma    = jp.id_plataforma_fk
    ${where}
    ORDER BY j.nome_jogo ASC
  `;

  return await db.all(sql, params);
}

async function readById(id) {
  const db = await Database.connect();

  const jogo = await db.get(`SELECT * FROM jogo WHERE id_jogo = ?`, [id]);

  if (!jogo) throw new Error('Jogo não encontrado');

  const generos = await db.all(
    `SELECT g.id_genero, g.nome_genero FROM genero g
     JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero
     WHERE jg.id_jogo_fk = ?`,
    [id]
  );

  const plataformas = await db.all(
    `SELECT p.id_plataforma, p.nome_plataforma FROM plataforma p
     JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma
     WHERE jp.id_jogo_fk = ?`,
    [id]
  );

  return { ...jogo, generos, plataformas };
}

async function create({ nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos = [], plataformas = [], nota_media = null, total_avaliacoes = 0 }) {
  const db = await Database.connect();

  if (nome_jogo && desenvolvedora && data_lancamento && descricao) {
    const { lastID } = await db.run(
      `INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, nota_media, total_avaliacoes, capa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome_jogo, desenvolvedora, data_lancamento, descricao, nota_media, total_avaliacoes, capa || null]
    );

    for (const gId of generos) {
      await db.run(`INSERT OR IGNORE INTO jogo_genero (id_jogo_fk, id_genero_fk) VALUES (?, ?)`, [lastID, gId]);
    }
    for (const pId of plataformas) {
      await db.run(`INSERT OR IGNORE INTO jogo_plataforma (id_jogo_fk, id_plataforma_fk) VALUES (?, ?)`, [lastID, pId]);
    }

    return await readById(lastID);
  } else {
    throw new Error('Campos obrigatórios: nome_jogo, desenvolvedora, data_lancamento, descricao');
  }
}

async function update({ id, nome_jogo, desenvolvedora, data_lancamento, descricao, capa }) {
  const db = await Database.connect();

  const { changes } = await db.run(
    `UPDATE jogo SET nome_jogo = ?, desenvolvedora = ?, data_lancamento = ?, descricao = ?, capa = ?
     WHERE id_jogo = ?`,
    [nome_jogo, desenvolvedora, data_lancamento, descricao, capa, id]
  );

  if (changes === 1) return readById(id);

  throw new Error('Jogo não encontrado');
}

async function remove(id) {
  const db = await Database.connect();

  await db.run(`DELETE FROM jogo_genero    WHERE id_jogo_fk = ?`, [id]);
  await db.run(`DELETE FROM jogo_plataforma WHERE id_jogo_fk = ?`, [id]);

  const { changes } = await db.run(`DELETE FROM jogo WHERE id_jogo = ?`, [id]);
  if (changes === 1) return true;

  throw new Error('Jogo não encontrado');
}

// Recalcula nota_media e total_avaliacoes de um jogo após criação/edição/remoção de avaliação
async function atualizarNota(id) {
  const db = await Database.connect();

  const nota = await db.get(
    `SELECT AVG(nota) AS media, COUNT(*) AS total FROM avaliacao WHERE id_jogo_fk = ?`,
    [id]
  );

  await db.run(
    `UPDATE jogo SET nota_media = ?, total_avaliacoes = ? WHERE id_jogo = ?`,
    [nota.media, nota.total, id]
  );
}

// Retorna estatísticas gerais do sistema
async function getStats() {
  const db = await Database.connect();

  const total_jogos = await db.get(`SELECT COUNT(*) AS count FROM jogo`);
  const total_aval = await db.get(`SELECT COUNT(*) AS count FROM avaliacao`);
  const total_usuarios = await db.get(`SELECT COUNT(*) AS count FROM usuario`);
  const total_plat = await db.get(`SELECT COUNT(*) AS count FROM plataforma`);

  return {
    total_jogos: total_jogos?.count || 0,
    total_aval: total_aval?.count || 0,
    total_usuarios: total_usuarios?.count || 0,
    total_plat: total_plat?.count || 0,
  };
}

// Retorna jogos em destaque (lançamentos e melhores avaliados)
async function getDestaques() {
  const db = await Database.connect();

  const lancamentos = await db.all(`
    SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento, 
           nota_media, total_avaliacoes, capa
    FROM jogo
    ORDER BY data_lancamento DESC
    LIMIT 8
  `);

  const melhores = await db.all(`
    SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento, 
           nota_media, total_avaliacoes, capa
    FROM jogo
    WHERE nota_media IS NOT NULL
    ORDER BY nota_media DESC
    LIMIT 8
  `);

  return { lancamentos, melhores };
}

export default { readAll, readById, create, update, remove, atualizarNota, getStats, getDestaques };
