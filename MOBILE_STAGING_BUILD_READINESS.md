# AngelOS Mobile Staging Build Readiness

## Current gate

AngelOS is configured for separate Development, Staging, and Production app identities. The Staging profile uses internal distribution, so an iPhone/iPad must be registered with the Apple Developer team before an ad hoc build can be installed.

The repository now fails closed for staging/production when any of these are missing or unsafe:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy anon key remains fallback only)
- `EXPO_PUBLIC_API_URL`
- HTTPS for live endpoints
- non-localhost API endpoint

## SDK upgrade required before first device release

The current mobile package was originally scaffolded on Expo SDK 53. As of August 2026, Expo SDK 57 is the current stable line and requires Node 22.13.x or newer.

Do not hand-edit all compatible Expo package versions. On a networked development machine:

```bash
cd apps/mobile
npm install expo@^57.0.0
npx expo install --fix
npx expo-doctor
npm run typecheck
```

Then return to the repo root and run:

```bash
npm run check
npm run verify:mobile-release
```

Only proceed to EAS after both pass.

## EAS staging environment

Set the Preview environment values in EAS, not in committed `.env` files:

```bash
eas env:set --name EXPO_PUBLIC_APP_ENV --value staging --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value <STAGING_SUPABASE_URL> --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value <STAGING_PUBLISHABLE_KEY> --environment preview --visibility sensitive
eas env:set --name EXPO_PUBLIC_API_URL --value <HTTPS_STAGING_API_URL> --environment preview --visibility plaintext
```

Client `EXPO_PUBLIC_*` values are bundled into the app and must never contain the Supabase service-role key, OpenAI key, or other server secrets.

## First iPhone/iPad build sequence

1. Sign in to the Expo/EAS account.
2. Confirm paid Apple Developer Program access.
3. From `apps/mobile`, run `eas device:create` for the test iPhone/iPad.
4. Run the SDK upgrade and release verification above.
5. Run `eas build --platform ios --profile staging`.
6. Install the internal build from the EAS build URL.
7. Sign in with the deliberate AngelOS staging Auth account.
8. Run the live Founder + two-tenant acceptance sequence.

For later non-interactive ad hoc builds, refresh the provisioning profile when new devices are registered.

## Not yet a blocker for internal staging, but required before public branding/store release

- final AngelOS app icon and splash assets
- App Store listing copy/screenshots/privacy labels
- production API URL
- TestFlight production distribution profile
