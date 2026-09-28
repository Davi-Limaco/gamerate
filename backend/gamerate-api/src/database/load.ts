import Migration from '@/database/migration.ts';
import Seed from '@/database/seeders.ts';

export default async function load() {
  await Migration.up();
  await Seed.up();
}

if (import.meta.main) {
  await load();
}
