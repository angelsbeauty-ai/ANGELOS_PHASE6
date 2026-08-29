# Sprint 6 Build Notes

## Architecture

- Private Supabase Storage bucket: `angelos-media`.
- Object path: `<workspaceId>/<assetId>/<safeFilename>`.
- `media_assets` stores durable business metadata and permission state.
- `media_asset_links` connects one business copy to client/appointment/treatment context without duplicating the file.
- `media_usage_events` is ready for later content/message/export audit use.
- Backend creates signed upload tokens only after workspace authorization.
- Backend finalizes only after verifying the object exists.

## Product simplicity

This deliberately removes Google Drive from the subscriber-critical path. A user can start with only a phone, their camera roll, and AngelOS.

## Production hardening later

- streaming/resumable large-video uploader
- thumbnails/transcoding jobs
- perceptual duplicate detection
- semantic before/after/healed classification
- device-native Save to Files/share adapter
- storage quota/usage UI after beta data tells us realistic allowances
