/** Bucket ảnh món ăn, tạo trong supabase/migrations/0003_cong_dong.sql */
export const ANH_MON_BUCKET = "anh-mon";

export const ANH_MON_MIME = ["image/jpeg", "image/png", "image/webp"];

/** Trùng với file_size_limit của bucket. Ảnh đã nén ở client nên hiếm khi chạm. */
export const ANH_MON_MAX_BYTES = 5 * 1024 * 1024;
