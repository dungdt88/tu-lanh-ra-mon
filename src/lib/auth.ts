import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PublicProfile } from "@/lib/supabase/database.types";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: PublicProfile | null;
};

/** Người đang đăng nhập, kèm hồ sơ công khai. null khi là khách. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    profile: profile ?? null,
  };
}

/**
 * Như getCurrentUser nhưng khách bị đá về trang đăng nhập.
 *
 * Middleware đã chặn sẵn phần cộng đồng; đây là lớp thứ hai cho trường hợp
 * middleware không chạy (matcher sót đường dẫn, hoặc trang được gọi từ chỗ
 * khác) - đừng bỏ vì "middleware lo rồi".
 */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(next)}`);
  return user;
}

/** Tên hiện lên bài đăng khi người dùng chưa đặt tên. */
export function displayNameOf(profile: PublicProfile | null): string {
  return (
    profile?.display_name?.trim() || profile?.handle || "Người nấu ẩn danh"
  );
}
