-- Remove a user's notes atomically when their Auth account is deleted.
ALTER TABLE public.study_notes
  DROP CONSTRAINT IF EXISTS study_notes_user_id_fkey,
  ADD CONSTRAINT study_notes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
