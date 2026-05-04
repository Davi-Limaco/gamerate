-- ═══════════════════════════════════════════════
--  GameRate — schema.sql (PostgreSQL / Supabase)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS perfil (
    id_perfil   SERIAL PRIMARY KEY,
    nome_perfil VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario   SERIAL PRIMARY KEY,
    nome_usuario VARCHAR(150) NOT NULL,
    email        VARCHAR(180) NOT NULL UNIQUE,
    senha        VARCHAR(200) NOT NULL,
    id_perfil_fk INT NOT NULL REFERENCES perfil(id_perfil),
    data_criacao DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS jogo (
    id_jogo          SERIAL PRIMARY KEY,
    nome_jogo        VARCHAR(200) NOT NULL,
    desenvolvedora   VARCHAR(150) NOT NULL,
    data_lancamento  DATE NOT NULL,
    descricao        VARCHAR(1500) NOT NULL,
    nota_media       NUMERIC(3,1),
    total_avaliacoes INT DEFAULT 0,
    capa             VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS plataforma (
    id_plataforma   SERIAL PRIMARY KEY,
    nome_plataforma VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS jogo_plataforma (
    id_jogo_fk      INT NOT NULL REFERENCES jogo(id_jogo) ON DELETE CASCADE,
    id_plataforma_fk INT NOT NULL REFERENCES plataforma(id_plataforma),
    PRIMARY KEY (id_jogo_fk, id_plataforma_fk)
);

CREATE TABLE IF NOT EXISTS genero (
    id_genero   SERIAL PRIMARY KEY,
    nome_genero VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS jogo_genero (
    id_jogo_fk   INT NOT NULL REFERENCES jogo(id_jogo) ON DELETE CASCADE,
    id_genero_fk INT NOT NULL REFERENCES genero(id_genero),
    PRIMARY KEY (id_jogo_fk, id_genero_fk)
);

CREATE TABLE IF NOT EXISTS avaliacao (
    id_avaliacao    SERIAL PRIMARY KEY,
    id_usuario_fk   INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_jogo_fk      INT NOT NULL REFERENCES jogo(id_jogo) ON DELETE CASCADE,
    nota            NUMERIC(2,1) CHECK (nota BETWEEN 1 AND 5),
    titulo          VARCHAR(200) NOT NULL,
    texto           VARCHAR(2000) NOT NULL,
    data_publicacao DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS comentario (
    id_comentario   SERIAL PRIMARY KEY,
    id_avaliacao_fk INT NOT NULL REFERENCES avaliacao(id_avaliacao) ON DELETE CASCADE,
    id_usuario_fk   INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    texto           VARCHAR(2000) NOT NULL,
    data_comentario DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS curtida (
    id_avaliacao_fk INT NOT NULL REFERENCES avaliacao(id_avaliacao) ON DELETE CASCADE,
    id_usuario_fk   INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    data_curtida    DATE NOT NULL,
    PRIMARY KEY (id_avaliacao_fk, id_usuario_fk)
);

CREATE TABLE IF NOT EXISTS usuario_seguidor (
    id_seguidor_fk INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_usuario_fk  INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    data_inicio    DATE NOT NULL,
    PRIMARY KEY (id_seguidor_fk, id_usuario_fk)
);

CREATE TABLE IF NOT EXISTS notificacao (
    id_notificacao SERIAL PRIMARY KEY,
    titulo         VARCHAR(200) NOT NULL,
    mensagem       VARCHAR(2000) NOT NULL,
    data_envio     DATE
);

CREATE TABLE IF NOT EXISTS notificacao_usuario (
    id_notificacao_fk INT NOT NULL REFERENCES notificacao(id_notificacao) ON DELETE CASCADE,
    id_usuario_fk     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    lido              BOOLEAN NOT NULL DEFAULT FALSE,
    data_visualizacao DATE,
    PRIMARY KEY (id_notificacao_fk, id_usuario_fk)
);

CREATE TABLE IF NOT EXISTS comunicacao_site (
    id_comunicacao   SERIAL PRIMARY KEY,
    email_contato    VARCHAR(200) NOT NULL,
    tipo             VARCHAR(200) NOT NULL,
    mensagem         VARCHAR(2000) NOT NULL,
    data_comunicacao DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS resposta_comunicacao (
    id_resposta       SERIAL PRIMARY KEY,
    id_comunicacao_fk INT NOT NULL REFERENCES comunicacao_site(id_comunicacao) ON DELETE CASCADE,
    id_usuario_fk     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    texto_resposta    VARCHAR(2000) NOT NULL,
    data_resposta     DATE NOT NULL
);
