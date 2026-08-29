# Production Hardening Phase 7 — Expo SDK 57 Upgrade Gate

## Status

Prepared and verified, but **not executed in this sandbox** because the npm registry is unreachable. No dependency versions were guessed or falsely marked upgraded.

## Verified against current Expo documentation

- Expo SDK 57 targets React Native 0.86.
- Expo SDK 57 targets React 19.2.3.
- Expo SDK 57 requires Node 22.13.x or newer.
- Expo Router for SDK 57 is on the 57.0.x line.
- Existing AngelOS application code has no direct `@react-navigation/*` imports, so the SDK 56+ Expo Router import migration does not require application-code changes.

## Added

`scripts/upgrade-expo-sdk57.sh`

The script:

1. refuses to run on an unsupported Node version;
2. refuses to modify packages if npm is unreachable;
3. installs `expo@^57.0.0` only on the mobile workspace;
4. runs `npx expo install --fix`;
5. installs the Expo Router runtime dependency set through `expo install`, so Expo chooses compatible versions;
6. runs `expo-doctor`;
7. verifies the resolved Expo / React Native / React / Expo Router major-minor versions;
8. runs AngelOS static and TypeScript checks.

## Networked execution

From the repository root:

```bash
npm run upgrade:expo57
```

Only after that passes:

```bash
npm run verify:mobile-release
npx eas-cli@latest build --platform ios --profile staging
```

## Remaining external blockers

- npm/network access for the SDK upgrade and dependency install;
- live staging NestJS API URL;
- EAS/Expo account authentication and iOS device registration / Apple credentials as required by EAS;
- staging public Supabase config in the EAS `preview` environment.

The staging Supabase database remains live and invite-only. No production Supabase project changes are part of this phase.
