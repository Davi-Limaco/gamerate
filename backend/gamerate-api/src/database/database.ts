/**
 * database/database.ts — Gerenciador de conexão SQLite com abstração Promise
 */

import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dbFile = resolve('src', 'database', 'db.sqlite');

interface RunResult {
  changes: number;
  lastID: number;
}

interface Database {
  run(sql: string, params?: any[]): Promise<RunResult>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  close(): Promise<void>;
}

function parseParams(params: any[] = []): any[] {
  return Array.isArray(params) ? params : [params];
}

function parseRow<T = any>(row: any): T {
  return row ? { ...row } : row;
}

function createPromiseDatabase(database: DatabaseSync): Database {
  return {
    async run(sql: string, params?: any[]): Promise<RunResult> {
      const result = database.prepare(sql).run(...parseParams(params));
      return {
        changes: result.changes,
        lastID: Number(result.lastInsertRowid),
      };
    },

    async get<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
      return parseRow<T>(database.prepare(sql).get(...parseParams(params)));
    },

    async all<T = any>(sql: string, params?: any[]): Promise<T[]> {
      return database.prepare(sql).all(...parseParams(params)).map(parseRow<T>);
    },

    async close(): Promise<void> {
      database.close();
    },
  };
}

async function connect(): Promise<Database> {
  return createPromiseDatabase(new DatabaseSync(dbFile));
}

export default { connect };
