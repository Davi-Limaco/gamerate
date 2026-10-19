// Recria um banco SQLite descartável para os testes: apaga o arquivo, aplica as
// migrations (prisma migrate deploy) e roda o seed (admin, perfis, jogos e
// avaliadores de demonstração). Uso: node tests/setup/prepare-db.mjs <arquivo.env>
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const envFile = process.argv[2] ?? 'tests/env/test.env';
process.loadEnvFile(envFile);

// DATABASE_URL é relativo a prisma/schema.prisma ("file:../src/database/x.sqlite").
const relative = process.env.DATABASE_URL.replace(/^file:/, '');
const dbPath = path.resolve('prisma', relative);
for (const file of [dbPath, `${dbPath}-journal`]) {
  if (existsSync(file)) rmSync(file);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npx', ['prisma', 'migrate', 'deploy']);
run('npx', ['tsx', 'prisma/seed.ts']);
console.log(`[tests] banco de teste pronto: ${dbPath}`);
