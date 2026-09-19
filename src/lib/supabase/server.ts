import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DB_SCHEMA, SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./env";
import type { Database } from "./database.types";

/** Client dùng trong Server Component / Route Handler. null khi chưa cấu hình. */
export async function createClient() {
  if (!hasSupabase) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: DB_SCHEMA },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Gọi từ Server Component thì không set được cookie - middleware lo phần này
        }
      },
    },
  });
}
