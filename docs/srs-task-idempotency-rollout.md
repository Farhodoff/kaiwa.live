# SRS task idempotency rollout

## Contract and order

1. Deploy `supabase/migrations/20261029064607_tasks_srs_review_idempotency.sql` through the normal reviewed migration process **before** enabling the application writer. A missing migration must fail visibly, not silently bypass database persistence or idempotency. No remote migration was applied during implementation.
2. The application writer (`TaskService.addReviewTask`) must send both `srs_lesson_id` and `srs_review_date`, mapping `srsLessonId`/`srsReviewDate`. Use a stable lesson ID and the intended review calendar date (`YYYY-MM-DD`), not a retry-time timestamp or the mutable `due_date`.
3. `addReviewTask` treats **only** SQLSTATE `23505` mentioning **`tasks_srs_review_unique`** as a no-op returning `null`. It does not fetch, overwrite, reopen, or upsert the existing task; the next normal `fetchTasks` reloads the authoritative row, including its completion state. A partial index is not a named UNIQUE constraint usable with `ON CONFLICT ON CONSTRAINT`.
4. All other database and network errors propagate. Authenticated writes must not fall back to local creation and disguise a failed database write. Guest local creation for non-UUID user IDs is retained.

Both metadata columns are nullable, but `tasks_srs_review_pair_check` requires both NULL or both non-NULL with a nonblank lesson ID (space-trimmed for validation, stored unchanged). The unique key is `(user_id, srs_lesson_id, srs_review_date)` where `deleted_at IS NULL AND srs_lesson_id IS NOT NULL`. Completed active tasks still block duplicates. Soft deletion permits a replacement; restoring an old row conflicts if its replacement remains active. Different days, lessons, and users are independent.

Existing manual/legacy tasks stay unchanged with NULL metadata; no title parsing, deduplication, or backfill occurs. Old clients remain compatible but do not gain SRS idempotency until they send metadata. RLS, policies, and grants are unchanged.

## Local regression check

Use **only a fresh, disposable local PostgreSQL database**, never a production/staging connection. From the repository root, run `psql -X -v ON_ERROR_STOP=1 -d srs_idempotency_test -f supabase/tests/tasks_srs_review_idempotency.sql` with explicit local connection options for your ephemeral cluster. The runner refuses an existing `auth` schema or `public.tasks`, creates its minimal fixture, includes the exact migration, executes DO-block assertions, and rolls everything back. No Docker, pgTAP, Supabase services, or full migration replay is required. This tests database invariants, not Auth/RLS or application behavior.

## Deployment checks and fallback

- The ALTER TABLE/check validation and ordinary (nonconcurrent) index build take locks and scan the existing table; schedule a low-traffic window and assess table size/lock waits first. Newly added metadata is NULL, so legacy rows cannot collide.
- After deployment, inspect `pg_indexes` for `public.tasks` / `tasks_srs_review_unique` and `pg_constraint` for `tasks_srs_review_pair_check`; verify the index is unique and valid in `pg_index`. Monitor unexpected `23505`/`23514` errors once the writer is enabled.
- Prefer rolling back/disabling the application writer while retaining the additive schema. If schema removal is necessary, stop all metadata writers first and use a separately reviewed migration to drop the index, check, and columns; dropping columns loses stored SRS identity and removing the index removes race protection.
