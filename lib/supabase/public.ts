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
  });
}

export const supabase = getSupabaseClient();
