/**
 * App chạy được cả khi chưa cấu hình Supabase: lúc đó dùng dữ liệu mock
 * trong src/data. Khi có đủ 2 biến môi trường thì tự chuyển sang đọc DB.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
