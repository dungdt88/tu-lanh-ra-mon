/** Bỏ dấu tiếng Việt để tìm kiếm không cần gõ dấu */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Viết hoa chữ đầu, giữ nguyên phần còn lại người dùng gõ */
export function capitalize(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
