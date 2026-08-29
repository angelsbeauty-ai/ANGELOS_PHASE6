# Sprint 8 Acceptance — Analytics + AI Marketing Coach

Sprint 8 is accepted when AngelOS can turn measured content performance into simple, evidence-aware marketing guidance without inventing unavailable metrics.

## Data integrity

- [ ] Analytics rows are workspace-scoped and protected by RLS.
- [ ] Metrics may remain `null` when a platform does not expose them.
- [ ] User-entered metrics are labeled `manual_entry`, never `provider_sync`.
- [ ] Future verified provider adapters have a separate normalization boundary.
- [ ] A subscriber cannot write analytics into another workspace.

## Analytics overview

- [ ] A 7–365 day overview can summarize the latest available snapshot per published content variant.
- [ ] Dashboard separates/retains attention, engagement, intent, and business-result metrics rather than fabricating a single platform metric.
- [ ] Business scoring gives bookings/inquiries materially more weight than views/reach.
- [ ] Strongest measured post can be identified when evidence exists.
- [ ] Format/platform/objective patterns can be summarized from measured posts.
- [ ] No measured posts returns an honest empty state instead of invented performance.

## Posting-time guidance

- [ ] Audience-activity data is preferred when available.
- [ ] Owned post performance is the fallback when enough measured posts exist.
- [ ] Posting-time output includes `low`, `medium`, or `high` confidence.
- [ ] Sparse data returns “insufficient data / test and learn,” not a fake universal best time.
- [ ] Time-window calculations use the workspace timezone.

## Marketing profile + local context

- [ ] Owner can save primary goal, experience level, ideal client, and service area.
- [ ] Marketing Coach uses the workspace goal as strategy context.
- [ ] Saved local/service-area context is available to the coach.
- [ ] Sprint 8 does NOT claim live local events/trends until a current-data research provider is connected.

## AI Marketing Coach

- [ ] Coach receives bounded analytics evidence rather than unrestricted workspace data.
- [ ] Coach is instructed never to invent metrics, attribution, audience behavior, or local events.
- [ ] Coach gives one strongest next marketing action.
- [ ] Coach explains why in plain language.
- [ ] Coach ends with one focused next-step question or offer to act.
- [ ] Sparse evidence is framed as a test, not a fact.
- [ ] If the AI provider fails, deterministic marketing guidance still works.
- [ ] Coach runs are retained with evidence/confidence/provider/model for auditability.

## Mobile experience

- [ ] Home links to Analytics.
- [ ] Analytics shows a small set of readable cards, not an enterprise dashboard.
- [ ] Evidence confidence is visible.
- [ ] Posting-time recommendation is visible only when evidence supports it.
- [ ] “Tell me what to do next” runs the Marketing Coach.
- [ ] Marketing Profile screen lets the owner define goal, experience, ideal client, and service area.

## Honest provider boundary

- [ ] Live Instagram/Facebook/TikTok analytics sync is not falsely marked connected.
- [ ] Provider adapter interface exists for future verified OAuth/scopes/capability integration.
- [ ] Manual metrics remain visibly distinguishable from future provider-synced metrics.

## Static verification performed in this package

- TypeScript/TSX files added for Sprint 8 pass `transpileModule` syntax diagnostics.
- Full package-aware `tsc` remains blocked in this container because npm dependencies are not installed/reachable.
