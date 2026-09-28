import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const dbFile = resolve('dev.db');

if (existsSync(dbFile)) {
  unlinkSync(dbFile);
  console.log('Banco de dados removido com sucesso.');
} else {
  console.log('Banco de dados não existe.');
}
