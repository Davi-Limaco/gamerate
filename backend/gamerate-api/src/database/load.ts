/**
 * database/load.ts — Script para carregar migration e seeders
 */

import Migration from './migration.js';
import Seed from './seeders.js';

async function load(): Promise<void> {
  await Migration.up();
  await Seed.up();
}

load();
