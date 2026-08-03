#!/usr/bin/env bash

set -euo pipefail

readonly EXPECTED_PROJECT_REF="ftuudbxhffnbzjxgqagp"
readonly LOCAL_DB_CONTAINER="supabase_db_design4public"
readonly PROD_SYNC_PROFILE="${SUPABASE_PROFILE:-design4public-dev}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

project_ref_file="supabase/.temp/project-ref"
if [[ ! -f "$project_ref_file" ]]; then
  echo "Supabase is not linked. Run: supabase link --project-ref $EXPECTED_PROJECT_REF --profile $PROD_SYNC_PROFILE" >&2
  exit 1
fi

linked_project_ref="$(<"$project_ref_file")"
if [[ "$linked_project_ref" != "$EXPECTED_PROJECT_REF" ]]; then
  echo "Refusing to sync from unexpected project ref: $linked_project_ref" >&2
  exit 1
fi

if ! docker inspect "$LOCAL_DB_CONTAINER" >/dev/null 2>&1; then
  echo "Local Supabase is not running. Run: supabase start" >&2
  exit 1
fi

local_pg_version_num="$(
  docker exec "$LOCAL_DB_CONTAINER" \
    psql -U postgres -d postgres -Atc "show server_version_num"
)"
if (( local_pg_version_num < 170000 )); then
  echo "Local PostgreSQL 17+ is required; found $local_pg_version_num." >&2
  exit 1
fi

dump_file="$(mktemp /private/tmp/design4public-prod-public.XXXXXX)"
cleanup() {
  rm -f "$dump_file"
}
trap cleanup EXIT

echo "Downloading public production content (read-only)..."
supabase db dump \
  --linked \
  --data-only \
  --use-copy \
  --schema public \
  --exclude public.profiles,public.inquiries \
  --file "$dump_file" \
  --profile "$PROD_SYNC_PROFILE" \
  --agent no

if grep -Eq '^COPY "public"\."(profiles|inquiries)" ' "$dump_file"; then
  echo "Sensitive table detected in dump; refusing to continue." >&2
  exit 1
fi
if ! grep -q '^COPY "public"\."projects" ' "$dump_file"; then
  echo "Expected production content is missing from the dump." >&2
  exit 1
fi

echo "Replacing local public content only..."
docker exec "$LOCAL_DB_CONTAINER" \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c '
    TRUNCATE TABLE
      public.home_featured,
      public.item_categories,
      public.item_tags,
      public.photo_items,
      public.photo_tags,
      public.project_categories,
      public.project_items,
      public.project_photos,
      public.project_tags,
      public.search_index,
      public.site_settings,
      public.photos,
      public.items,
      public.projects,
      public.tags,
      public.categories,
      public.brands
    RESTART IDENTITY CASCADE;
  '

docker exec -i "$LOCAL_DB_CONTAINER" \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$dump_file"

docker exec "$LOCAL_DB_CONTAINER" \
  psql -U postgres -d postgres -At -F ' | ' -c '
    select
      (select count(*) from public.projects) as projects,
      (select count(*) from public.items) as items,
      (select count(*) from public.photos) as photos,
      (select count(*) from public.profiles) as local_profiles,
      (select count(*) from public.inquiries) as local_inquiries;
  '

echo "Production public content synced to local Supabase. Remote data was not modified."
