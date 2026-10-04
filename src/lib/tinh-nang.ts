/**
 * Cộng đồng và mọi thứ cần đăng nhập (bài khoe món, bếp, công thức nhà mình,
 * hồ sơ, trang đăng nhập). Tắt thì app chỉ còn phần dùng không cần tài khoản.
 *
 * Đăng nhập tắt theo vì nó chỉ phục vụ cộng đồng: lối vào duy nhất của trang
 * đăng nhập là tab Cộng đồng. Dữ liệu trong Supabase giữ nguyên, bật lại là
 * mọi thứ quay về như cũ.
 */
export const CONG_DONG_BAT = false;

/** Đường dẫn bị đưa về trang chủ khi CONG_DONG_BAT tắt. */
export const DUONG_DAN_CONG_DONG = [
  "/cong-dong",
  "/bai",
  "/bep",
  "/cong-thuc",
  "/ho-so",
  "/doi-mat-khau",
  "/dang-nhap",
];

export function laDuongDanCongDong(pathname: string): boolean {
  return DUONG_DAN_CONG_DONG.some(
    (goc) => pathname === goc || pathname.startsWith(`${goc}/`),
  );
}
