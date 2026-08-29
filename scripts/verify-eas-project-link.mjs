import fs from 'node:fs';

const appJson = JSON.parse(fs.readFileSync(new URL('../apps/mobile/app.json', import.meta.url), 'utf8'));
const projectId = appJson.expo?.extra?.eas?.projectId;

if (!projectId || typeof projectId !== 'string' || projectId.trim().length < 20) {
  console.error('AngelOS is not linked to an EAS project yet.');
  console.error('Run from apps/mobile: npx eas-cli@latest init');
  console.error('Then commit the generated expo.extra.eas.projectId before the first staging build.');
  process.exit(1);
}

console.log(`AngelOS EAS project link present: ${projectId}`);
