-- Prisma SQLite DateTime reads ISO-8601 timestamps. The legacy node:sqlite
-- database stored date-only values, so preserve each calendar date at midnight.
UPDATE "usuario"
SET "data_criacao" = "data_criacao" || 'T00:00:00.000Z'
WHERE length("data_criacao") = 10;

UPDATE "jogo"
SET "data_lancamento" = "data_lancamento" || 'T00:00:00.000Z'
WHERE length("data_lancamento") = 10;

UPDATE "avaliacao"
SET "data_publicacao" = "data_publicacao" || 'T00:00:00.000Z'
WHERE length("data_publicacao") = 10;

UPDATE "comunicacao_site"
SET "data_comunicacao" = "data_comunicacao" || 'T00:00:00.000Z'
WHERE length("data_comunicacao") = 10;
