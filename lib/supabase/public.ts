import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되어 있지 않습니다.");
  }

  if (!key) {
    throw new Error(
      "Supabase 공개 키(NEXT_PUBLIC_SUPABASE_ANON_KEY 또는 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)가 설정되어 있지 않습니다."
    );
  }

  return { url, key };
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // Tag every public read with its base table (`sb:<table>`) so mutations can
    // purge the fetch Data Cache via revalidateTag. Cross-entity revalidation
    // needs this: revalidatePath('/items/[slug]', 'page') does NOT invalidate the
    // cached fetches of already-rendered concrete item pages in Next 14, so a
    // project change could not otherwise refresh derived relations on item detail
    // pages (see lib/revalidation.ts).
    global: {
      fetch: (input, init) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : (input as Request).url;
        const table = url.match(/\/rest\/v1\/([a-z_]+)/)?.[1];
        const next = table ? { next: { tags: [`sb:${table}`] } } : {};
        return fetch(input as RequestInfo, { ...init, ...next } as RequestInit);
      },
    },
  });
}

export const supabase = getSupabaseClient();
