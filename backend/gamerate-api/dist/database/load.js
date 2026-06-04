import Migration from './migration';
import Seed from './seeders';
async function load() {
    await Migration.up();
    await Seed.up();
}
load();
