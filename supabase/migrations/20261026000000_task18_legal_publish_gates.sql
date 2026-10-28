-- Migration: 20261026000000_task18_legal_publish_gates.sql
-- Description: Task 18 — hard legal gates at the database level.
--   An exam can only be published when:
--     * copyright_confirmed = true
--     * license_type <> 'restricted' (needs explicit legal approval that the
--       product never grants automatically)
--     * attribution licenses (cc-by / cc-by-sa) carry source_name, author and
--       a traceable source_url
--   The application enforces the same rules in
--   ExamWorkflowService.validateForPublish(); this constraint makes them
--   impossible to bypass with a direct write.

ALTER TABLE public.exams
    DROP CONSTRAINT IF EXISTS exams_legal_publish_gate;

ALTER TABLE public.exams
    ADD CONSTRAINT exams_legal_publish_gate
    CHECK (
        is_published = false
        OR (
            copyright_confirmed = true
            AND COALESCE(license_type, 'original') <> 'restricted'
            AND (
                COALESCE(license_type, 'original') NOT IN ('cc-by', 'cc-by-sa')
                OR (
                    COALESCE(BTRIM(source_name), '') <> ''
                    AND COALESCE(BTRIM(author), '') <> ''
                    AND COALESCE(BTRIM(source_url), '') <> ''
                )
            )
        )
    ) NOT VALID;

-- Comment for operators: the constraint is added NOT VALID on purpose, so
-- legacy rows are not re-validated here, while every new insert/update is
-- enforced.
COMMENT ON CONSTRAINT exams_legal_publish_gate ON public.exams IS
    'Task 18 legal publish gate: published exams require confirmed copyright, a non-restricted license and (for attribution licenses) full attribution metadata.';
