const pool = require('../db/connection');

const MiscModel = {

  async listarGeneros() {
    const r = await pool.query(
      `SELECT g.id_genero, g.nome_genero, COUNT(jg.id_jogo_fk)::int AS total_jogos
       FROM genero g
       LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero
       GROUP BY g.id_genero ORDER BY total_jogos DESC`
    );
    return r.rows;
  },

  async listarPlataformas() {
    const r = await pool.query(
      `SELECT p.id_plataforma, p.nome_plataforma, COUNT(jp.id_jogo_fk)::int AS total_jogos
       FROM plataforma p
       LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma
       GROUP BY p.id_plataforma ORDER BY total_jogos DESC`
    );
    return r.rows;
  },

  async criarContato({ email_contato, tipo, mensagem }) {
    await pool.query(
      `INSERT INTO comunicacao_site (email_contato, tipo, mensagem, data_comunicacao)
       VALUES ($1,$2,$3,CURRENT_DATE)`,
      [email_contato, tipo, mensagem]
    );
  },

  async listarContatos() {
    const r = await pool.query(
      'SELECT * FROM comunicacao_site ORDER BY data_comunicacao DESC'
    );
    return r.rows;
  },

};

module.exports = MiscModel;
