"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./env";
import type { Database } from "./database.types";

/** Client dùng trong component phía trình duyệt. null khi chưa cấu hình Supabase. */
export function createClient() {
  if (!hasSupabase) return null;
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
