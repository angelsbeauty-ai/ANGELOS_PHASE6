import fs from 'node:fs';

const appJson = JSON.parse(fs.readFileSync(new URL('../apps/mobile/app.json', import.meta.url), 'utf8'));
const expo = appJson.expo ?? {};
const problems = [];

if (!expo.slug || expo.slug !== 'angelos') problems.push('expo.slug must be angelos');
if (!expo.ios?.bundleIdentifier) problems.push('iOS bundleIdentifier is required');
if (expo.ios?.supportsTablet !== true) problems.push('iPad support must remain enabled');
if (!expo.android?.package) problems.push('Android package is required');

const picker = (expo.plugins ?? []).find((item) => Array.isArray(item) && item[0] === 'expo-image-picker');
if (!picker) {
  problems.push('expo-image-picker config plugin is required');
} else {
  const config = picker[1] ?? {};
  if (!String(config.photosPermission ?? '').includes('AngelOS')) problems.push('photo library permission must explain AngelOS usage');
  if (!String(config.cameraPermission ?? '').includes('AngelOS')) problems.push('camera permission must explain AngelOS usage');
  if (config.microphonePermission !== false) problems.push('microphone permission must be disabled until AngelOS actually records audio');
}

const appConfig = fs.readFileSync(new URL('../apps/mobile/app.config.js', import.meta.url), 'utf8');
for (const required of ['.staging', '.dev', 'angelos-staging', 'angelos-dev']) {
  if (!appConfig.includes(required)) problems.push(`app.config.js is missing environment identity marker: ${required}`);
}

if (problems.length) {
  console.error('AngelOS iOS release configuration failed:');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log('AngelOS iOS release configuration passed.');
