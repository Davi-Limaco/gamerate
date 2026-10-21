-- CreateTable
CREATE TABLE "favorito" (
    "id_favorito" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario_fk" INTEGER NOT NULL,
    "id_jogo_fk" INTEGER NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorito_id_usuario_fk_fkey" FOREIGN KEY ("id_usuario_fk") REFERENCES "usuario" ("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "favorito_id_jogo_fk_fkey" FOREIGN KEY ("id_jogo_fk") REFERENCES "jogo" ("id_jogo") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "midia" (
    "id_midia" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "id_usuario_fk" INTEGER NOT NULL,
    "id_jogo_fk" INTEGER,
    "data_envio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "midia_id_usuario_fk_fkey" FOREIGN KEY ("id_usuario_fk") REFERENCES "usuario" ("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "midia_id_jogo_fk_fkey" FOREIGN KEY ("id_jogo_fk") REFERENCES "jogo" ("id_jogo") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- CreateIndex
CREATE UNIQUE INDEX "favorito_id_usuario_fk_id_jogo_fk_key" ON "favorito"("id_usuario_fk", "id_jogo_fk");

-- CreateIndex
CREATE INDEX "midia_id_usuario_fk_idx" ON "midia"("id_usuario_fk");
