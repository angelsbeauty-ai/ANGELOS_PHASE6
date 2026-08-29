import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ignoredDirs = new Set(['.git','node_modules','dist','.expo','coverage']);
const allowedExamples = new Set(['.env.example','.env.staging.example']);
const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else inspect(full);
  }
}

function inspect(file) {
  const relative = path.relative(root, file);
  if (allowedExamples.has(path.basename(file))) return;
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  const patterns = [
    { name: 'OpenAI-style secret', re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
    { name: 'Supabase service-role JWT value', re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*eyJ[A-Za-z0-9._-]{40,}/g },
    { name: 'Bearer JWT literal', re: /Bearer\s+eyJ[A-Za-z0-9._-]{40,}/g },
    { name: 'Private key material', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
  ];
  for (const { name, re } of patterns) {
    for (const match of text.matchAll(re)) findings.push(`${relative}: ${name} (${match[0].slice(0, 24)}…)`);
  }
}

walk(root);
if (findings.length) throw new Error(`Possible committed secrets detected:\n${findings.join('\n')}`);
console.log('AngelOS secret scan passed (no obvious committed credentials).');
