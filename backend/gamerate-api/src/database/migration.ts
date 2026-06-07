import Database from '@/database/database.js';

async function up() {
  const db = await Database.connect();

  await db.run(`CREATE TABLE IF NOT EXISTS perfil (
    id_perfil   INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_perfil VARCHAR(50) NOT NULL UNIQUE
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS usuario (
    id_usuario   INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_usuario VARCHAR(150) NOT NULL,
    email        VARCHAR(180) NOT NULL UNIQUE,
    senha        VARCHAR(200) NOT NULL,
    id_perfil_fk INTEGER NOT NULL,
    data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY (id_perfil_fk) REFERENCES perfil(id_perfil)
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS jogo (
    id_jogo          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_jogo        VARCHAR(200) NOT NULL,
    desenvolvedora   VARCHAR(150) NOT NULL,
    data_lancamento  DATE NOT NULL,
    descricao        VARCHAR(1500) NOT NULL,
    nota_media       REAL,
    total_avaliacoes INTEGER NOT NULL DEFAULT 0,
    capa             VARCHAR(1000)
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS plataforma (
    id_plataforma   INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_plataforma VARCHAR(60) NOT NULL UNIQUE
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS jogo_plataforma (
    id_jogo_fk       INTEGER NOT NULL,
    id_plataforma_fk INTEGER NOT NULL,
    PRIMARY KEY (id_jogo_fk, id_plataforma_fk),
    FOREIGN KEY (id_jogo_fk)       REFERENCES jogo(id_jogo),
    FOREIGN KEY (id_plataforma_fk) REFERENCES plataforma(id_plataforma)
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS genero (
    id_genero   INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_genero VARCHAR(50) NOT NULL UNIQUE
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS jogo_genero (
    id_jogo_fk   INTEGER NOT NULL,
    id_genero_fk INTEGER NOT NULL,
    PRIMARY KEY (id_jogo_fk, id_genero_fk),
    FOREIGN KEY (id_jogo_fk)   REFERENCES jogo(id_jogo),
    FOREIGN KEY (id_genero_fk) REFERENCES genero(id_genero)
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS avaliacao (
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
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS comunicacao_site (
    id_comunicacao   INTEGER PRIMARY KEY AUTOINCREMENT,
    email_contato    VARCHAR(200) NOT NULL,
    tipo             VARCHAR(50)  NOT NULL,
    mensagem         VARCHAR(2000) NOT NULL,
    data_comunicacao DATE NOT NULL DEFAULT CURRENT_DATE
  )`);

  console.log('Migration concluída com sucesso.');
}

export default { up };
