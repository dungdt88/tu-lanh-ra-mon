/**
 * Địa chỉ gốc của app, dùng để dựng link tuyệt đối trong thẻ Open Graph.
 *
 * Link chia sẻ lên Facebook/Zalo phải là URL tuyệt đối thì mới hiện ảnh xem
 * trước. Chạy ở máy thì để trống cũng được, mặc định là localhost.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";
