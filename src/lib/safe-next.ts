/**
 * Chỉ cho quay về đường dẫn nội bộ, tránh bị lợi dụng làm trạm chuyển hướng.
 *
 * `//evil.com` và `/\evil.com` đều bắt đầu bằng "/" nhưng trình duyệt hiểu là
 * địa chỉ của tên miền khác.
 */
export function safeNext(value: unknown, macDinh = "/cong-dong"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return macDinh;
  if (value.startsWith("//") || value.startsWith("/\\")) return macDinh;
  return value;
}
