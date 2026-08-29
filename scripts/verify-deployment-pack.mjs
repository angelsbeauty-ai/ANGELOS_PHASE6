import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'apps/api/Dockerfile',
  'apps/api/.env.staging.example',
  'railway.json',
  'scripts/post-deploy-smoke.mjs',
  'scripts/staging-smoke.mjs',
  'scripts/verify-deployment-env.mjs',
  'DEPLOYMENT_PACK.md',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Deployment pack is incomplete: ${missing.join(', ')}`);
  process.exit(1);
}

const dockerfile = fs.readFileSync(path.join(root, 'apps/api/Dockerfile'), 'utf8');
for (const expected of ['USER node', 'CMD ["node", "dist/main.js"]', 'EXPOSE 3000']) {
  if (!dockerfile.includes(expected)) {
    console.error(`Dockerfile missing release requirement: ${expected}`);
    process.exit(1);
  }
}

const railway = JSON.parse(fs.readFileSync(path.join(root, 'railway.json'), 'utf8'));
if (railway?.deploy?.healthcheckPath !== '/health/ready') {
  console.error('Railway healthcheckPath must be /health/ready.');
  process.exit(1);
}

const lockfiles = ['package-lock.json', 'npm-shrinkwrap.json', 'apps/api/package-lock.json']
  .filter((file) => fs.existsSync(path.join(root, file)));
if (!lockfiles.length) {
  console.warn('WARNING: No npm lockfile is committed. First networked dependency install must create and commit package-lock.json before production promotion.');
}

console.log('AngelOS deployment pack structure verified.');
