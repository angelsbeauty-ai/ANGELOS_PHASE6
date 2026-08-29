# AngelOS Sprint 6 Acceptance — Media Library

Sprint 6 implements the phone-first, AngelOS-managed business media foundation.

## Locked product behavior

- Subscribers do **not** need Google Drive or another storage app/account.
- Photos/Camera are import sources; AngelOS keeps its own private business copy.
- Anything the owner intentionally imports is automatically preserved; there is no second Save decision.
- Deleting the original from the phone later must not break the AngelOS business record.
- Media may be linked to a client, appointment, or treatment and carry roles such as before/after/healed.
- Marketing permission is stored with the asset and follows it into later content workflows.
- Google Drive remains optional later, not a V1 dependency.

## Acceptance checks

1. Authenticated workspace owner can reserve a media upload.
2. Upload path is workspace-scoped and uses a private `angelos-media` bucket.
3. Upload finalization verifies the object exists before marking the asset uploaded.
4. Another workspace cannot query the media row or storage object through RLS.
5. Owner can import one or multiple photos/videos from device Photos after granting permission at point of use.
6. Owner can capture a photo from Camera after granting permission at point of use.
7. Imported media is preserved in AngelOS without modifying/deleting the phone original.
8. Media imported from a client profile is automatically linked to that client.
9. Media library lists business copies and can generate short-lived signed view URLs.
10. Export produces a short-lived signed download URL; the device can save it through the native Files/share flow in the later native export adapter.
11. Marketing permission and content status can be updated without replacing the asset.
12. No public storage bucket or permanent public media URL exists.

## Honest V1 boundary

- Image/video semantic classification (automatically deciding before vs after vs healed from pixels) belongs to the Content/Marketing media-review sprint. Sprint 6 creates the secure storage, links, labels, and permission model it will use.
- `expo-image-picker` is declared but dependencies cannot be installed/typechecked in this offline container.
- Current mobile upload adapter uses an in-memory `ArrayBuffer`. Before broad production video use, replace this with a streaming/resumable upload path for large videos.
- Native `Save to Files` UX is represented by secure export URLs; the native share/file-save adapter is a small follow-up when device dependencies can be installed and tested.
