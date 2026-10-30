# Kanji SRS and writing progress

## Deployment order

1. Back up the database using the normal deployment process.
2. Apply pending migrations through the approved Supabase deployment workflow. This feature depends on `20261028000002_create_lesson_kanji_progress.sql` and `20261030030348_kanji_srs_writing_progress.sql`.
3. Deploy the frontend only after the migration succeeds. Never expose a service-role key to the browser.
4. Verify with two separate authenticated accounts: writing results survive reload/new-device sign-in, due reviews appear, and a reset affects only the selected account.

No remote migrations are applied by the implementation/tests.

## Behavior

- Correct reviews advance through **1, 3, 7, 14 calendar days**, then remain at 14. An incorrect review restarts the one-day interval. Existing mastery semantics (two correct reviews) are preserved; mastery is not a claim of perfect handwriting.
- The due list includes overdue items and anything scheduled through the end of the device's local day. Only previously reviewed Kanji are scheduled.
- Lesson mastery counts evidence recorded under a curriculum lesson ID. General JLPT mastery counts distinct level characters across lesson and free-writing evidence. These are different scopes, not disjoint character sets. Manual `jlpt_item_mastery` statuses remain separate and are not changed by this feature.
- Free writing is stored under `jlpt-N5` … `jlpt-N1`. Due-list practice retains the original lesson/free-writing scope.
- Writing accuracy is the cumulative mean of measured attempts. Stroke-order status is the latest attempt's result. The writing-progress count requires mean accuracy ≥70% and a passing latest stroke order, deduplicated by character.
- The evaluator compares arc-length-resampled polylines against KanjiVG reference paths: shape, stroke sequence, direction, and stroke count. This is **approximate geometric practice feedback**, not AI handwriting recognition or an official writing grade. Tracing uses the same paths as evaluation. If reference paths or SVG geometry APIs are unavailable, no score, progress, or XP is fabricated.
- Blank drawings do not earn XP. Re-submitting an unchanged drawing is disabled. A character earns 15 XP at most once per mounted Canvas session; this is not a server-enforced anti-cheat or daily XP limit.
- Vocabulary reinforcement combines deduplicated Kanji examples and curriculum words. Readings/meanings start hidden for active recall, with reveal and speech buttons.

## Reset and export

- JSON export includes this user's locally cached lesson/free-writing Kanji records, SRS and writing metadata (version `2.0`). A server-loading warning means the export may not yet contain other-device records; retry loading first. XP, lesson completion and manual JLPT statuses are outside this export.
- Reset requires confirmation, affects **all levels of Kanji practice**, and leaves XP, lesson completion and manual JLPT statuses unchanged.
- Signed-in reset requires network access and a matching authenticated account. The invoker RPC resets only `auth.uid()` rows under existing owner-only RLS. It also checks the expected account ID to prevent a sign-in switch from resetting the wrong account.
- Zero-attempt rows are retained as reset markers. A timestamp guard rejects delayed older upserts, including offline retries, rather than restoring pre-reset counters. Local reset markers are queued and uploaded too. Failed reset synchronization is surfaced to the user, not silently reported as full success.
- Per-record synchronization is latest-write-wins, **not additive multi-device counter merging**. As with timestamp-based synchronization generally, devices should use automatic clock synchronization. Concurrent practice from devices with stale caches is not a multi-writer event ledger.
- Guest progress stays on the device. Authenticated progress requires the migration and successful synchronization.

## Validation

Focused tests cover SRS intervals, today's reviews, scope separation, writing evaluation/direction/order, weighted accuracy, invalid imports, offline payloads, fresh-device restoration/pagination, reset failures/account switches, panel confirmation and Canvas integration.

Database test: `supabase/tests/kanji_srs_writing_progress.sql` must be run with `psql -X -v ON_ERROR_STOP=1 -f ...` against a **fresh disposable database only**. It creates minimal auth fixtures and applies the actual migrations, then checks metadata, constraints, owner isolation, ownership reassignment rejection, reset isolation and stale-upsert protection. It refuses a database with an existing `auth` schema. It is not a production or linked-project test.
