-- This script backfills the public.profiles table with any users that exist
-- in auth.users but do not have a corresponding profile entry. This is
-- necessary for existing users created before the profile-creation trigger
-- was in place.

INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
FROM
  auth.users
WHERE
  id NOT IN (SELECT id FROM public.profiles);
