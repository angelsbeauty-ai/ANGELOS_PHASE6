# Sprint 8 Build Notes

## What was added

- `0008_analytics_marketing_intelligence.sql`
  - marketing profiles
  - content metric snapshots
  - audience activity snapshots
  - marketing coach run history
  - workspace RLS policies
- NestJS `analytics` module
  - overview endpoint
  - marketing profile read/update
  - manual content-metric ingestion for testing/manual entry
  - audience-activity ingestion
  - AI Marketing Coach endpoint
- Provider-neutral analytics adapter contract for future Meta/TikTok integrations.
- Mobile Analytics screen and Marketing Profile screen.
- AI mock behavior for zero-cost Marketing Coach development.

## Recommendation hierarchy implemented

1. Owner's measured content/business outcomes.
2. Owner's measured audience activity.
3. Saved local/service-area and marketing-profile context.
4. Insufficient-data state that explicitly recommends testing and learning.

Sprint 8 intentionally does not hardcode a generic “best time to post” as truth.

## Business-outcome weighting

The prototype content score deliberately weights bookings and inquiries far above views/reach. This is only a ranking heuristic for V1 insight generation; raw platform metrics remain visible separately and are never replaced by the score.

## Not claimed complete yet

- Live Meta/TikTok analytics API sync.
- Live current local-event/trend research.
- Exact cross-platform conversion attribution when providers do not expose it.
- Retention timeline charts requiring platform-specific granular data.

These remain behind explicit provider/capability adapters so later integrations do not force a rewrite of the Analytics screen or Marketing Coach.
