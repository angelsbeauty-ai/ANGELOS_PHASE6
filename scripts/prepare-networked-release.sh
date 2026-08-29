#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

node - <<'NODE'
const [maj,min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 13)) {
  console.error(`ERROR: Node 22.13+ required; current ${process.version}`);
  process.exit(1);
}
NODE

if ! npm view expo@^57.0.0 version --fetch-timeout=10000 --fetch-retries=0 >/dev/null 2>&1; then
  echo "ERROR: npm registry is unreachable. No dependencies were changed." >&2
  exit 2
fi

echo "[1/7] Upgrading mobile workspace to Expo SDK 57"
npm run upgrade:expo57

echo "[2/7] Verifying root lockfile exists"
if [[ ! -f package-lock.json ]]; then
  echo "ERROR: package-lock.json was not generated." >&2
  exit 3
fi

echo "[3/7] Validating lockfile syntax"
node -e "JSON.parse(require('fs').readFileSync('package-lock.json','utf8')); console.log('OK: package-lock.json parses')"

echo "[4/7] Removing installed dependencies for reproducibility test"
rm -rf node_modules apps/api/node_modules apps/mobile/node_modules packages/shared/node_modules

echo "[5/7] Reinstalling strictly from package-lock.json"
npm ci

echo "[6/7] Running full AngelOS checks"
npm run check
(
  cd apps/mobile
  npx expo-doctor
)
npm run verify:mobile-sdk

echo "[7/7] Release execution gate passed"
cat <<'DONE'

Networked dependency gate passed.
The repository now has a reproducible npm lockfile and a clean npm-ci install has been proven.

Next:
  1. Review and commit package-lock.json + Expo package changes.
  2. Configure the real HTTPS staging API and EAS Preview environment.
  3. Run: npm run prepare:first-ios-build
  4. After staging acceptance, update the API Dockerfile to use npm ci with the reviewed lockfile.
DONE
