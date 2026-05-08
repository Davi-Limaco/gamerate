-- ═══════════════════════════════════════════════════════════════════
--  GameRate — schema.sql (PostgreSQL / Supabase)
--  Versão com validações completas de dados e tratamento de erros
-- ═══════════════════════════════════════════════════════════════════

-- ── TABELA: perfil ───────────────────────────────────────────────
-- Armazena os tipos de perfil do sistema (Jogador, Crítico, Admin)
CREATE TABLE IF NOT EXISTS perfil (
    id_perfil   SERIAL PRIMARY KEY,
    -- NOT NULL: todo perfil precisa de nome
    -- UNIQUE: não pode existir dois perfis com o mesmo nome
    -- TRIM: remove espaços acidentais
    nome_perfil VARCHAR(50) NOT NULL
        CHECK (LENGTH(TRIM(nome_perfil)) > 0),       -- CHECK: impede strings vazias com espaços
    CONSTRAINT uq_perfil_nome UNIQUE (nome_perfil)   -- UNIQUE: evita perfis duplicados
);

-- ── TABELA: usuario ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario   SERIAL PRIMARY KEY,
    -- NOT NULL + CHECK: nome não pode ser vazio nem só espaços
    nome_usuario VARCHAR(150) NOT NULL
        CHECK (LENGTH(TRIM(nome_usuario)) >= 3),     -- CHECK: mínimo 3 caracteres reais
    -- NOT NULL + UNIQUE + CHECK: email válido e único
    email        VARCHAR(180) NOT NULL
        CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),  -- CHECK: formato de email
    -- NOT NULL: senha nunca pode ser nula (armazenada como hash bcrypt)
    senha        VARCHAR(200) NOT NULL
        CHECK (LENGTH(senha) >= 8),                  -- CHECK: hash bcrypt tem sempre >= 60 chars
    -- FK obrigatória: todo usuário precisa de um perfil válido
    id_perfil_fk INT NOT NULL
        REFERENCES perfil(id_perfil)
        ON DELETE RESTRICT                           -- RESTRICT: impede excluir perfil com usuários
        ON UPDATE CASCADE,                           -- CASCADE: atualiza FK se id mudar
    data_criacao DATE NOT NULL
        DEFAULT CURRENT_DATE,                        -- DEFAULT: preenchido automaticamente
    CONSTRAINT uq_usuario_email UNIQUE (email)       -- UNIQUE explícito para mensagem clara
);

-- ── TABELA: jogo ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jogo (
    id_jogo          SERIAL PRIMARY KEY,
    nome_jogo        VARCHAR(200) NOT NULL
        CHECK (LENGTH(TRIM(nome_jogo)) > 0),         -- CHECK: nome não pode ser só espaços
    desenvolvedora   VARCHAR(150) NOT NULL
        CHECK (LENGTH(TRIM(desenvolvedora)) > 0),    -- CHECK: desenvolvedora obrigatória
    data_lancamento  DATE NOT NULL,
    descricao        VARCHAR(1500) NOT NULL
        CHECK (LENGTH(TRIM(descricao)) >= 10),       -- CHECK: mínimo 10 chars de descrição
    -- nota_media calculada automaticamente pelas avaliações
    nota_media       NUMERIC(3,1)
        CHECK (nota_media IS NULL OR nota_media BETWEEN 0.0 AND 5.0), -- CHECK: entre 0 e 5
    total_avaliacoes INT NOT NULL DEFAULT 0
        CHECK (total_avaliacoes >= 0),               -- CHECK: nunca negativo
    capa             VARCHAR(1000),                  -- opcional, pode ser NULL
    CONSTRAINT uq_jogo_nome_dev UNIQUE (nome_jogo, desenvolvedora) -- UNIQUE: mesmo jogo não duplicado
);

-- ── TABELA: plataforma ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plataforma (
    id_plataforma   SERIAL PRIMARY KEY,
    nome_plataforma VARCHAR(60) NOT NULL
        CHECK (LENGTH(TRIM(nome_plataforma)) > 0),   -- CHECK: nome não vazio
    CONSTRAINT uq_plataforma_nome UNIQUE (nome_plataforma) -- UNIQUE: sem plataformas duplicadas
);

-- ── TABELA: jogo_plataforma (N:N) ────────────────────────────────
CREATE TABLE IF NOT EXISTS jogo_plataforma (
    -- FK com CASCADE: se o jogo for excluído, remove as associações
    id_jogo_fk       INT NOT NULL
        REFERENCES jogo(id_jogo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    -- FK com RESTRICT: não exclui plataforma se tiver jogos associados
    id_plataforma_fk INT NOT NULL
        REFERENCES plataforma(id_plataforma)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    PRIMARY KEY (id_jogo_fk, id_plataforma_fk)       -- PK composta: impede associação duplicada
);

-- ── TABELA: genero ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS genero (
    id_genero   SERIAL PRIMARY KEY,
    nome_genero VARCHAR(50) NOT NULL
        CHECK (LENGTH(TRIM(nome_genero)) > 0),       -- CHECK: nome não vazio
    CONSTRAINT uq_genero_nome UNIQUE (nome_genero)   -- UNIQUE: sem gêneros duplicados
);

-- ── TABELA: jogo_genero (N:N) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS jogo_genero (
    id_jogo_fk   INT NOT NULL
        REFERENCES jogo(id_jogo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    id_genero_fk INT NOT NULL
        REFERENCES genero(id_genero)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    PRIMARY KEY (id_jogo_fk, id_genero_fk)           -- PK composta: impede associação duplicada
);

-- ── TABELA: avaliacao ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avaliacao (
    id_avaliacao    SERIAL PRIMARY KEY,
    id_usuario_fk   INT NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE                            -- CASCADE: remove avaliações do usuário deletado
        ON UPDATE CASCADE,
    id_jogo_fk      INT NOT NULL
        REFERENCES jogo(id_jogo)
        ON DELETE CASCADE                            -- CASCADE: remove avaliações do jogo deletado
        ON UPDATE CASCADE,
    -- CHECK: nota obrigatória entre 1.0 e 5.0 (escala do sistema)
    nota            NUMERIC(2,1) NOT NULL
        CHECK (nota BETWEEN 1.0 AND 5.0),
    titulo          VARCHAR(200) NOT NULL
        CHECK (LENGTH(TRIM(titulo)) >= 3),           -- CHECK: título mínimo 3 chars
    -- CHECK: texto mínimo 40 caracteres (regra de negócio do sistema)
    texto           VARCHAR(2000) NOT NULL
        CHECK (LENGTH(TRIM(texto)) >= 40),
    data_publicacao DATE NOT NULL
        DEFAULT CURRENT_DATE,
    -- UNIQUE composto: cada usuário só pode avaliar um jogo uma vez
    CONSTRAINT uq_avaliacao_usuario_jogo UNIQUE (id_usuario_fk, id_jogo_fk)
);

-- ── TABELA: comentario ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comentario (
    id_comentario   SERIAL PRIMARY KEY,
    id_avaliacao_fk INT NOT NULL
        REFERENCES avaliacao(id_avaliacao)
        ON DELETE CASCADE                            -- CASCADE: remove comentários da avaliação deletada
        ON UPDATE CASCADE,
    id_usuario_fk   INT NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    texto           VARCHAR(2000) NOT NULL
        CHECK (LENGTH(TRIM(texto)) >= 1),            -- CHECK: comentário não pode ser vazio
    data_comentario DATE NOT NULL
        DEFAULT CURRENT_DATE
);

-- ── TABELA: curtida ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS curtida (
    id_avaliacao_fk INT NOT NULL
        REFERENCES avaliacao(id_avaliacao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    id_usuario_fk   INT NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    data_curtida    DATE NOT NULL
        DEFAULT CURRENT_DATE,
    -- PK composta: cada usuário só pode curtir uma avaliação uma vez
    PRIMARY KEY (id_avaliacao_fk, id_usuario_fk)
);

-- ── TABELA: usuario_seguidor ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuario_seguidor (
    id_seguidor_fk INT NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    id_usuario_fk  INT NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    data_inicio    DATE NOT NULL
        DEFAULT CURRENT_DATE,
    -- PK composta: impede seguir a mesma pessoa duas vezes
    PRIMARY KEY (id_seguidor_fk, id_usuario_fk),
    -- CHECK: usuário não pode seguir a si mesmo
    CONSTRAINT ck_seguidor_diferente
        CHECK (id_seguidor_fk <> id_usuario_fk)
);

-- ── TABELA: notificacao ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacao (
    id_notificacao SERIAL PRIMARY KEY,
    titulo         VARCHAR(200) NOT NULL
        CHECK (LENGTH(TRIM(titulo)) > 0),            -- CHECK: título não vazio
    mensagem       VARCHAR(2000) NOT NULL
        CHECK (LENGTH(TRIM(mensagem)) > 0),          -- CHECK: mensagem não vazia
    data_envio     DATE NOT NULL
        DEFAULT CURRENT_DATE                         -- DEFAULT: data atual
);

-- ── TABELA: notificacao_usuario ──────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacao_usuario (
    id_notificacao_fk INT NOT NULL
        REFERENCES notificacao(id_notificacao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    id_usuario_fk     INT NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    lido              BOOLEAN NOT NULL DEFAULT FALSE, -- DEFAULT: não lida ao criar
    data_visualizacao DATE
        CHECK (data_visualizacao IS NULL OR data_visualizacao >= '2024-01-01'), -- CHECK: data plausível
    PRIMARY KEY (id_notificacao_fk, id_usuario_fk)   -- PK composta: sem duplicatas
);

-- ── TABELA: comunicacao_site ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS comunicacao_site (
    id_comunicacao   SERIAL PRIMARY KEY,
    email_contato    VARCHAR(200) NOT NULL
        CHECK (email_contato ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'), -- CHECK: email válido
    -- CHECK: tipo deve ser um dos valores permitidos
    tipo             VARCHAR(50) NOT NULL
        CHECK (tipo IN ('Dúvida', 'Denúncia', 'Erro', 'Sugestão')),
    mensagem         VARCHAR(2000) NOT NULL
        CHECK (LENGTH(TRIM(mensagem)) >= 10),        -- CHECK: mensagem mínimo 10 chars
    data_comunicacao DATE NOT NULL
        DEFAULT CURRENT_DATE
);

-- ── TABELA: resposta_comunicacao ─────────────────────────────────
CREATE TABLE IF NOT EXISTS resposta_comunicacao (
    id_resposta       SERIAL PRIMARY KEY,
    id_comunicacao_fk INT NOT NULL
        REFERENCES comunicacao_site(id_comunicacao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    id_usuario_fk     INT NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT                           -- RESTRICT: não exclui admin com respostas
        ON UPDATE CASCADE,
    texto_resposta    VARCHAR(2000) NOT NULL
        CHECK (LENGTH(TRIM(texto_resposta)) >= 5),   -- CHECK: resposta mínimo 5 chars
    data_resposta     DATE NOT NULL
        DEFAULT CURRENT_DATE
);

-- ═══════════════════════════════════════════════════════════════════
--  ÍNDICES — melhoram a performance das buscas mais frequentes
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_usuario_email          ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_avaliacao_jogo         ON avaliacao(id_jogo_fk);
CREATE INDEX IF NOT EXISTS idx_avaliacao_usuario      ON avaliacao(id_usuario_fk);
CREATE INDEX IF NOT EXISTS idx_comentario_avaliacao   ON comentario(id_avaliacao_fk);
CREATE INDEX IF NOT EXISTS idx_curtida_avaliacao      ON curtida(id_avaliacao_fk);
CREATE INDEX IF NOT EXISTS idx_jogo_nota              ON jogo(nota_media DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_jogo_lancamento        ON jogo(data_lancamento DESC);
