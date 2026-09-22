import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const migrationDir = path.join(root, 'supabase/migrations');
const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort();

if (files.length < 12) throw new Error(`Expected at least the 12 V1 migrations, found ${files.length}`);
if (!files.some((name) => name === '0013_staging_security_hardening.sql')) {
  throw new Error('Missing 0013_staging_security_hardening.sql');
}

files.forEach((name, index) => {
  const numbered = /^\d{4}_[a-z0-9_]+\.sql$/.test(name);
  const stamped = /^\d{14}_[a-z0-9_]+\.sql$/.test(name);
  if (index < 13) {
    const expected = String(index + 1).padStart(4, '0');
    if (!name.startsWith(expected + '_')) throw new Error(`Invalid migration sequence/name: ${name}`);
  } else if (!numbered && !stamped) {
    throw new Error(`Invalid migration sequence/name: ${name}`);
  }
  if (stamped && index > 0) {
    const prev = files[index - 1];
    if (/^\d{14}_/.test(prev) && name.slice(0, 14) === prev.slice(0, 14)) {
      throw new Error(`Duplicate migration timestamp: ${name}`);
    }
  }
  const sql = fs.readFileSync(path.join(migrationDir, name), 'utf8');
  if (!sql.trim()) throw new Error(`${name} is empty`);
});

const allSql = files.map((name) => fs.readFileSync(path.join(migrationDir, name), 'utf8')).join('\n');
for (const marker of [
  'workspace_id',
  'enable row level security',
  'platform_release_state',
  'beta_invites',
  'workspace_subscriptions',
  'needs_attention'
]) {
  if (!allSql.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Migration set missing expected V1 marker: ${marker}`);
}

console.log(`AngelOS migration sequence verification passed (${files.length} migrations).`);
