-- Baseline + rls_hardening tables were created by postgres, whose default
-- privileges grant anon/authenticated/service_role no DML, so every RLS
-- policy was dead code after a clean db reset (Postgres checks table GRANTs
-- before RLS). Production already carries the standard Supabase grants, so
-- this migration is an idempotent no-op there. RLS remains the row gate.
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.inquiries to anon;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant select on tables to anon, authenticated;
alter default privileges for role postgres in schema public grant insert, update, delete on tables to authenticated;
alter default privileges for role postgres in schema public grant all on tables to service_role;
alter default privileges for role postgres in schema public grant usage, select on sequences to anon, authenticated, service_role;
