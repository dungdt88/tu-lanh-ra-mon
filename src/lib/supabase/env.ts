/**
 * App chạy được cả khi chưa cấu hình Supabase: lúc đó dùng dữ liệu mock
 * trong src/data. Khi có đủ 2 biến môi trường thì tự chuyển sang đọc DB.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Toàn bộ bảng của dự án nằm trong schema riêng, không dùng `public`, để không
 * lẫn với dự án khác trong cùng project Supabase. Schema này phải được thêm vào
 * Settings > API > Exposed schemas thì PostgREST mới thấy.
 */
export const DB_SCHEMA = "tlrm" as const;
