# AngelOS Production Hardening Phase 8 — First iOS Build Gate

## Completed in this phase

- Added an iOS native release configuration verifier.
- Explicitly disabled Image Picker microphone permission because AngelOS currently captures still photos and does not record audio through that feature.
- Added a guarded first-device build helper (`npm run prepare:first-ios-build`).
- Added a hard EAS-project-link check (`npm run verify:eas-project-link`).
- Kept staging builds fail-closed on missing API/Supabase public configuration.
- Kept the Expo SDK 57 release gate from Phase 7.

## Current external gates

The first iPhone/iPad staging build cannot truthfully be launched from this environment yet because:

1. npm registry access is unavailable here, so Expo SDK 57 cannot be resolved/installed/doctor-checked.
2. AngelOS has not yet been linked to an EAS project (`expo.extra.eas.projectId` is intentionally absent until the owner authenticates to Expo/EAS and runs `eas init`).
3. A paid Apple Developer account and device registration are required for iOS ad hoc internal distribution.
4. The staging NestJS API still needs a live HTTPS host before the mobile release environment can pass.

## Networked-machine sequence

From the repository root:

```bash
npm run upgrade:expo57
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init
cd ../..
npm run verify:eas-project-link
```

Configure the EAS `preview` environment with:

- `EXPO_PUBLIC_APP_ENV=staging`
- `EXPO_PUBLIC_API_URL=https://<live-staging-api-host>`
- `EXPO_PUBLIC_SUPABASE_URL=https://hhzegavoyuicclsmrkwf.supabase.co`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging publishable key>`

Then:

```bash
npx eas-cli@latest device:create
npm run prepare:first-ios-build -- --execute
```

For internal iOS distribution, EAS uses ad hoc provisioning and includes registered device UDIDs in the provisioning profile. Registering a new device later requires a rebuild or re-signing.

## Security note

Do not put `SUPABASE_SERVICE_ROLE_KEY`, OpenAI server keys, Apple private keys, or Expo access tokens in `EXPO_PUBLIC_*` variables or commit them to the repository.
