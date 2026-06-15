import Migration from '@/database/migration.ts';
import Seed from '@/database/seeders.ts';

async function load() {
  await Migration.up();
  await Seed.up();
}

load();
