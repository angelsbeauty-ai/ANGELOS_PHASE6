#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"

cd "$ROOT_DIR"

node_major="$(node -p "Number(process.versions.node.split('.')[0])")"
node_minor="$(node -p "Number(process.versions.node.split('.')[1])")"
if (( node_major < 22 || (node_major == 22 && node_minor < 13) )); then
  echo "ERROR: Expo SDK 57 requires Node 22.13.x or newer. Current: $(node -v)" >&2
  exit 1
fi

if ! npm view expo@^57.0.0 version >/dev/null 2>&1; then
  echo "ERROR: npm registry is unreachable. No package versions were changed." >&2
  exit 2
fi

echo "[1/6] Installing Expo SDK 57"
npm install --workspace @angelos/mobile expo@^57.0.0

echo "[2/6] Aligning Expo-managed dependencies"
(
  cd "$MOBILE_DIR"
  npx expo install --fix
)

echo "[3/6] Ensuring required Expo Router peer/runtime packages"
(
  cd "$MOBILE_DIR"
  npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-image-picker
)

echo "[4/6] Running Expo Doctor"
(
  cd "$MOBILE_DIR"
  npx expo-doctor
)

echo "[5/6] Verifying SDK 57 resolved versions"
node <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('apps/mobile/package.json', 'utf8'));
const deps = {...pkg.dependencies, ...pkg.devDependencies};
function majorMinor(v='') { const m = String(v).match(/(\d+)\.(\d+)/); return m ? `${m[1]}.${m[2]}` : ''; }
const checks = [
  ['expo', '57.0'],
  ['react-native', '0.86'],
  ['react', '19.2'],
  ['expo-router', '57.0'],
];
let bad = false;
for (const [name, expected] of checks) {
  const actual = deps[name];
  if (!actual || majorMinor(actual) !== expected) {
    console.error(`ERROR: ${name} expected ${expected}.x-compatible range after Expo fix; found ${actual || 'missing'}`);
    bad = true;
  } else {
    console.log(`OK: ${name} ${actual}`);
  }
}
if (bad) process.exit(1);
NODE

echo "[6/6] Running AngelOS checks"
npm run verify:static
npm run typecheck

cat <<'DONE'

Expo SDK 57 upgrade checks passed.
Next commands:
  npm run verify:mobile-release
  npx eas-cli@latest build --platform ios --profile staging

Do not run the EAS build until EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL,
and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are configured in the EAS preview environment.
DONE
