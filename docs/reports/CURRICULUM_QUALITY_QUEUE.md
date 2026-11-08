# Curriculum Quality Queue

## Canonical content boundary

The bundled JSON under `src/data/curriculum/levels/` is the canonical published curriculum. The quality queue records audit findings, ownership, review notes and proposed revisions; it deliberately cannot mutate a bundled JSON lesson at runtime.

## Operator flow

1. An administrator opens **Admin → Quality** and selects **Auditni sinxronlash**.
2. The client audits all N5–N1 JSON files and sends only structural errors to `sync_curriculum_quality_issues`.
3. A reviewer assigns, triages and drafts a replacement exercise. The saved revision includes local validation results.
4. A different authorized Japanese expert approves it. The database rejects self-approval.
5. A developer applies the reviewed proposal to JSON in a source-controlled change, runs `npm run audit:jlpt-content`, and records that commit/release value when marking the queue item `published`.

## Security checks

- Row-level security permits read access only to reviewers/admins.
- There are no direct client INSERT, UPDATE or DELETE policies on the three queue tables.
- All mutations are SECURITY DEFINER RPCs which check reviewer/admin role, retain an immutable event, require reasons for rejected/reopened/quarantined decisions, and require a source-controlled version before publishing.
- Deploy the migration before enabling the panel: `20261107160000_curriculum_quality_queue.sql`.

## Manual RLS verification

Run these checks in a non-production Supabase environment with an authenticated student, reviewer and admin account:

1. Student `select` on `curriculum_quality_issues` returns no rows; calling any queue RPC raises a permission error.
2. Reviewer can select and create a revision, but direct table insert/update/delete fails.
3. Reviewer cannot mark an issue `expert_approved` or `published`.
4. Admin cannot approve an issue they created; another admin/expert can approve it.
5. Publishing without a commit/release value fails; publishing from any status other than `expert_approved` fails.
