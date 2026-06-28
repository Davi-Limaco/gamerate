-- CreateTable
CREATE TABLE "perfil" (
    "id_perfil" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_perfil" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_usuario" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "id_perfil_fk" INTEGER NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuario_id_perfil_fk_fkey" FOREIGN KEY ("id_perfil_fk") REFERENCES "perfil" ("id_perfil") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jogo" (
    "id_jogo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_jogo" TEXT NOT NULL,
    "desenvolvedora" TEXT NOT NULL,
    "data_lancamento" DATETIME NOT NULL,
    "descricao" TEXT NOT NULL,
    "nota_media" REAL,
    "total_avaliacoes" INTEGER NOT NULL DEFAULT 0,
    "capa" TEXT
);

-- CreateTable
CREATE TABLE "plataforma" (
    "id_plataforma" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_plataforma" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "jogo_plataforma" (
    "id_jogo_fk" INTEGER NOT NULL,
    "id_plataforma_fk" INTEGER NOT NULL,

    PRIMARY KEY ("id_jogo_fk", "id_plataforma_fk"),
    CONSTRAINT "jogo_plataforma_id_jogo_fk_fkey" FOREIGN KEY ("id_jogo_fk") REFERENCES "jogo" ("id_jogo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jogo_plataforma_id_plataforma_fk_fkey" FOREIGN KEY ("id_plataforma_fk") REFERENCES "plataforma" ("id_plataforma") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "genero" (
    "id_genero" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_genero" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "jogo_genero" (
    "id_jogo_fk" INTEGER NOT NULL,
    "id_genero_fk" INTEGER NOT NULL,

    PRIMARY KEY ("id_jogo_fk", "id_genero_fk"),
    CONSTRAINT "jogo_genero_id_jogo_fk_fkey" FOREIGN KEY ("id_jogo_fk") REFERENCES "jogo" ("id_jogo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jogo_genero_id_genero_fk_fkey" FOREIGN KEY ("id_genero_fk") REFERENCES "genero" ("id_genero") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id_avaliacao" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario_fk" INTEGER NOT NULL,
    "id_jogo_fk" INTEGER NOT NULL,
    "nota" REAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "data_publicacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avaliacao_id_usuario_fk_fkey" FOREIGN KEY ("id_usuario_fk") REFERENCES "usuario" ("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "avaliacao_id_jogo_fk_fkey" FOREIGN KEY ("id_jogo_fk") REFERENCES "jogo" ("id_jogo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comunicacao_site" (
    "id_comunicacao" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email_contato" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "data_comunicacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_nome_perfil_key" ON "perfil"("nome_perfil");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "plataforma_nome_plataforma_key" ON "plataforma"("nome_plataforma");

-- CreateIndex
CREATE UNIQUE INDEX "genero_nome_genero_key" ON "genero"("nome_genero");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_id_usuario_fk_id_jogo_fk_key" ON "avaliacao"("id_usuario_fk", "id_jogo_fk");
