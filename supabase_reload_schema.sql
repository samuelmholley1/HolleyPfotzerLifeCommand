-- This command notifies the PostgREST server to reload its schema cache.
-- Run this in the Supabase SQL Editor after making schema changes like adding
-- foreign keys to ensure the API recognizes the new relationships.
NOTIFY pgrst, 'reload schema';
