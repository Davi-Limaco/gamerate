import Database from './database';
async function up() {
    const db = await Database.connect();
    // Tabela: perfil (tipo de usuário: Jogador, Crítico, Administrador)
    await db.run(`
    CREATE TABLE perfil (
      id_perfil   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_perfil VARCHAR(50) NOT NULL UNIQUE
    )
  `);
    // Tabela: usuario (usuários cadastrados no sistema)
    await db.run(`
    CREATE TABLE usuario (
      id_usuario   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_usuario VARCHAR(150) NOT NULL,
      email        VARCHAR(180) NOT NULL UNIQUE,
      senha        VARCHAR(200) NOT NULL,
      id_perfil_fk INTEGER NOT NULL,
      data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
      FOREIGN KEY (id_perfil_fk) REFERENCES perfil(id_perfil)
    )
  `);
    // Tabela: jogo (catálogo de jogos da plataforma)
    await db.run(`
    CREATE TABLE jogo (
      id_jogo          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_jogo        VARCHAR(200) NOT NULL,
      desenvolvedora   VARCHAR(150) NOT NULL,
      data_lancamento  DATE NOT NULL,
      descricao        VARCHAR(1500) NOT NULL,
      nota_media       REAL,
      total_avaliacoes INTEGER NOT NULL DEFAULT 0,
      capa             VARCHAR(1000)
    )
  `);
    // Tabela: plataforma (PC, PS5, Xbox, etc.)
    await db.run(`
    CREATE TABLE plataforma (
      id_plataforma   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_plataforma VARCHAR(60) NOT NULL UNIQUE
    )
  `);
    // Tabela: jogo_plataforma (relacionamento N:N entre jogo e plataforma)
    await db.run(`
    CREATE TABLE jogo_plataforma (
      id_jogo_fk       INTEGER NOT NULL,
      id_plataforma_fk INTEGER NOT NULL,
      PRIMARY KEY (id_jogo_fk, id_plataforma_fk),
      FOREIGN KEY (id_jogo_fk)       REFERENCES jogo(id_jogo),
      FOREIGN KEY (id_plataforma_fk) REFERENCES plataforma(id_plataforma)
    )
  `);
    // Tabela: genero (Ação, RPG, Terror, etc.)
    await db.run(`
    CREATE TABLE genero (
      id_genero   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_genero VARCHAR(50) NOT NULL UNIQUE
    )
  `);
    // Tabela: jogo_genero (relacionamento N:N entre jogo e gênero)
    await db.run(`
    CREATE TABLE jogo_genero (
      id_jogo_fk   INTEGER NOT NULL,
      id_genero_fk INTEGER NOT NULL,
      PRIMARY KEY (id_jogo_fk, id_genero_fk),
      FOREIGN KEY (id_jogo_fk)   REFERENCES jogo(id_jogo),
      FOREIGN KEY (id_genero_fk) REFERENCES genero(id_genero)
    )
  `);
    // Tabela: avaliacao (review de um jogador para um jogo — única por par usuario/jogo)
    await db.run(`
    CREATE TABLE avaliacao (
      id_avaliacao    INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario_fk   INTEGER NOT NULL,
      id_jogo_fk      INTEGER NOT NULL,
      nota            REAL NOT NULL,
      titulo          VARCHAR(200) NOT NULL,
      texto           VARCHAR(2000) NOT NULL,
      data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
      UNIQUE (id_usuario_fk, id_jogo_fk),
      FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario),
      FOREIGN KEY (id_jogo_fk)    REFERENCES jogo(id_jogo)
    )
  `);
    // Tabela: comunicacao_site (formulário de contato público)
    await db.run(`
    CREATE TABLE comunicacao_site (
      id_comunicacao   INTEGER PRIMARY KEY AUTOINCREMENT,
      email_contato    VARCHAR(200) NOT NULL,
      tipo             VARCHAR(50) NOT NULL,
      mensagem         VARCHAR(2000) NOT NULL,
      data_comunicacao DATE NOT NULL DEFAULT CURRENT_DATE
    )
  `);
    console.log('Migration concluída com sucesso.');
}
export default { up };
