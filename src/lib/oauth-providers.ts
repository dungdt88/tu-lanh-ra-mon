import type { Provider } from "@supabase/supabase-js";

/**
 * Nút đăng nhập bằng dịch vụ ngoài.
 *
 * `x` là provider OAuth 2.0 của X; `twitter` trong supabase-js là bản OAuth
 * 1.0a cũ, đừng dùng. Để riêng một file (không nằm trong component "use
 * client") vì cả trang server lẫn form client đều cần danh sách này.
 */
export const NHA_CUNG_CAP = [
  { id: "google", ten: "Google" },
  { id: "facebook", ten: "Facebook" },
  { id: "x", ten: "X" },
] as const satisfies readonly { id: Provider; ten: string }[];

export type NhaCungCap = (typeof NHA_CUNG_CAP)[number]["id"];
