# Production Hardening Phase 6 — Mobile Build Readiness

Completed in this checkpoint:

- release-like mobile runtime configuration now fails closed instead of silently using localhost/placeholders;
- staging EAS builds auto-increment native build numbers;
- Node minimum aligned with the current Expo SDK 57 toolchain (`>=22.13.0`);
- mobile build environment preflight added;
- Expo SDK release gate added;
- exact EAS Preview environment setup documented;
- exact iPhone/iPad internal-distribution sequence documented;
- service-role/OpenAI secrets remain server-only.

## Deliberate unresolved gate

The repository is still on Expo SDK 53. The current sandbox cannot resolve npm packages (`registry.npmjs.org` DNS fails), so the SDK 57 upgrade was not guessed or partially applied. A networked machine must run Expo's package-aware upgrade commands, `expo install --fix`, and `expo-doctor` before the first staging binary is built.

The NestJS staging API also remains undeployed because no hosting connector is available in this session.
