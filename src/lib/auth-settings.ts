import "server-only";

import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  hasSupabase,
} from "@/lib/supabase/env";

/**
 * Tên cờ trong /auth/v1/settings khác tên provider gọi ở client:
 * X vẫn nằm dưới cờ `twitter`.
 */
const CO_TRONG_SETTINGS: Record<string, string> = { x: "twitter" };

type Settings = { external?: Record<string, boolean> };

/**
 * Những provider đang thật sự bật trong Supabase.
 *
 * Bấm nút của provider chưa bật thì trình duyệt rời app rồi mới nhận JSON
 * "provider is not enabled" của Supabase - app không bắt được lỗi đó để báo
 * tử tế, nên thà không hiện nút.
 *
 * Trả về null khi không hỏi được (mất mạng, chưa cấu hình): lúc đó hiện hết
 * còn hơn giấu mất đường đăng nhập.
 */
export async function layProviderDangBat(
  ids: readonly string[],
): Promise<string[] | null> {
  if (!hasSupabase) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      // Bật/tắt provider là việc hiếm, hỏi lại mỗi 5 phút là đủ.
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const { external }: Settings = await res.json();
    if (!external) return null;

    return ids.filter((id) => external[CO_TRONG_SETTINGS[id] ?? id]);
  } catch {
    return null;
  }
}
