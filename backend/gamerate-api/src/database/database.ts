import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dbFile = resolve('src', 'database', 'db.sqlite');

type DbParam = string | number | null;

function parseParams(params: DbParam[] = []): DbParam[] {
  return Array.isArray(params) ? params : [params];
}

function parseRow(row: unknown): Record<string, unknown> | undefined {
  return row != null && typeof row === 'object'
    ? { ...(row as Record<string, unknown>) }
    : undefined;
}

function createPromiseDatabase(database: DatabaseSync) {
  return {
    async run(sql: string, params?: DbParam[]) {
      const result = database
        .prepare(sql)
        .run(...(parseParams(params) as any[])); // 👈 as any[]

      return { changes: result.changes, lastID: Number(result.lastInsertRowid) };
    },

    async get(sql: string, params?: DbParam[]) {
      return parseRow(
        database.prepare(sql).get(...(parseParams(params) as any[])) // 👈 as any[]
      );
    },

    async all(sql: string, params?: DbParam[]) {
      return database
        .prepare(sql)
        .all(...(parseParams(params) as any[])) // 👈 as any[]
        .map(parseRow) as Record<string, unknown>[];
    },

    async close() {
      database.close();
    },
  };
}

async function connect() {
  return createPromiseDatabase(new DatabaseSync(dbFile));
}

export default { connect };