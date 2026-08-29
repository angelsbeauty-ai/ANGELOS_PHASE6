# Production Hardening Phase 10 — Networked Release Execution Gate

## Purpose

Phase 10 converts the remaining dependency/toolchain work into a single fail-closed command for a networked engineering environment.

## Command

```bash
npm run prepare:networked-release
```

The command:

1. Requires Node 22.13+.
2. Proves the npm registry is reachable before modifying dependencies.
3. Runs the guarded Expo SDK 57 upgrade.
4. Requires a generated root `package-lock.json`.
5. Deletes installed dependency trees.
6. Runs `npm ci` from the lockfile.
7. Runs AngelOS static checks, workspace typechecks, the Nest API build, Expo Doctor, and the SDK 57 verifier.

If npm is unreachable, the command exits before changing package versions.

## Current environment result

The current sandbox still cannot resolve `registry.npmjs.org` (`EAI_AGAIN`). Therefore:

- Expo SDK 57 package changes have **not** been guessed or partially applied here.
- `package-lock.json` has **not** been fabricated.
- a real dependency install / Nest build / Expo Doctor run cannot be claimed from this environment.

## Production promotion rule

Do not promote AngelOS to production until all of the following are true:

- `prepare:networked-release` passes on a networked machine;
- `package-lock.json` is reviewed and committed;
- the staging NestJS API is live over HTTPS and `/health/ready` passes;
- Founder + tester tenant-isolation acceptance passes;
- the first EAS staging build installs and completes device smoke testing.

The API Dockerfile should move from `npm install` to deterministic `npm ci` only after the reviewed lockfile is committed and the clean `npm ci` proof has passed.
