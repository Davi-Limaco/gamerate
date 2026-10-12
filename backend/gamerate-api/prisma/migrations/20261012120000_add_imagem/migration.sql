-- CreateTable
CREATE TABLE "imagem" (
    "id_imagem" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caminho" TEXT NOT NULL,
    "id_usuario_fk" INTEGER NOT NULL,
    "data_envio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "imagem_id_usuario_fk_fkey" FOREIGN KEY ("id_usuario_fk") REFERENCES "usuario" ("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateIndex
CREATE UNIQUE INDEX "imagem_id_usuario_fk_key" ON "imagem"("id_usuario_fk");
