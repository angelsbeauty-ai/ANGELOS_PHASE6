import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../apps/mobile/package.json', import.meta.url), 'utf8'));
const expoRange = pkg.dependencies?.expo ?? '';
const match = String(expoRange).match(/(\d+)/);
const major = match ? Number(match[1]) : NaN;
const minimum = 57;
const mode = process.argv.includes('--advisory') ? 'advisory' : 'enforce';

if (!Number.isFinite(major)) {
  console.error('Unable to determine Expo SDK major from apps/mobile/package.json.');
  process.exit(1);
}

if (major < minimum) {
  const message = `AngelOS mobile is on Expo SDK ${major}; release-like builds require SDK ${minimum}+ before TestFlight/internal beta.`;
  if (mode === 'advisory') {
    console.warn(`WARNING: ${message}`);
    process.exit(0);
  }
  console.error(message);
  console.error('Run the documented SDK upgrade in a networked environment, then run npx expo install --fix and npx expo-doctor.');
  process.exit(1);
}

console.log(`Expo SDK ${major} satisfies AngelOS release minimum ${minimum}.`);
