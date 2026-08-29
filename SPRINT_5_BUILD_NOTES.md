# Sprint 5 Build Notes

AngelOS now has a real unified messaging domain rather than placeholder UI.

### Provider boundary
`MessagingProviderAdapter` is the stable boundary for future Instagram/Facebook, LINE, and TikTok transports. Sprint 5 includes only `ManualDemoMessagingAdapter` so the end-to-end workflow can be tested without falsely claiming external messages were delivered.

### Identity rule
A channel identity is stronger evidence than a name. If an external user ID is already linked, AngelOS reuses that CRM client. If it is unseen, AngelOS creates a new lead and links that identity. It never merges by name similarity.

### Delivery rule
External delivery evidence is backend-controlled. Every send uses a stable message idempotency key. The app never changes a message to `sent` based only on a button tap.

### Guided autonomy
Conversational AI replies are drafts by default. Explicit owner approval can send them. Future approved routine categories (confirmation/reminder/aftercare/FAQ) can later use auto-send rules without changing the data model.

### Translation
Original client text is never overwritten. Translation is stored separately and can target the assistant owner's preferred language.
