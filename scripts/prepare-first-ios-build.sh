#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

execute=false
if [[ "${1:-}" == "--execute" ]]; then execute=true; fi

export EXPO_PUBLIC_APP_ENV="${EXPO_PUBLIC_APP_ENV:-staging}"
if [[ "$EXPO_PUBLIC_APP_ENV" != "staging" ]]; then
  echo "ERROR: first-device build helper only permits EXPO_PUBLIC_APP_ENV=staging." >&2
  exit 1
fi

npm run verify:static
npm run verify:mobile-release
npm run verify:eas-project-link

if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx is unavailable." >&2
  exit 1
fi

if ! npx --yes eas-cli@latest --version >/dev/null 2>&1; then
  echo "ERROR: EAS CLI cannot be resolved. Check npm/network access." >&2
  exit 2
fi

if ! npx --yes eas-cli@latest whoami >/dev/null 2>&1; then
  echo "ERROR: Not authenticated to Expo/EAS. Run: npx eas-cli@latest login" >&2
  exit 3
fi

if [[ "$execute" != true ]]; then
  cat <<'MSG'
AngelOS first-device preflight passed through EAS authentication.

Before building:
1. Register the target iPhone/iPad: npx eas-cli@latest device:create
2. Confirm the EAS preview environment contains:
   EXPO_PUBLIC_API_URL
   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
3. Re-run this script with --execute.

No build was started in preflight mode.
MSG
  exit 0
fi

npx --yes eas-cli@latest build --platform ios --profile staging
