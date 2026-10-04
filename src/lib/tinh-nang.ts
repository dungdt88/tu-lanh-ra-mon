/**
 * Cộng đồng và mọi thứ cần đăng nhập (bài khoe món, bếp, công thức nhà mình,
 * hồ sơ, trang đăng nhập). Tắt thì app chỉ còn phần dùng không cần tài khoản.
 *
 * Đăng nhập tắt theo vì nó chỉ phục vụ cộng đồng: lối vào duy nhất của trang
 * đăng nhập là tab Cộng đồng. Dữ liệu trong Supabase giữ nguyên, bật lại là
 * mọi thứ quay về như cũ.
 */
export const CONG_DONG_BAT = false;

/**
 * Trợ lý chat: trang /tro-ly, khung chat sửa món ở trang món, và /api/chat.
 *
 * Những gì trợ lý đã lưu trong máy người dùng (món đã chỉnh, nguyên liệu cả
 * nhà tránh) vẫn được áp dụng khi tắt: danh sách tránh có thể là dị ứng, bỏ
 * qua nó thì gợi ý lại món người ta không ăn được.
 */
export const TRO_LY_BAT = false;

const DUONG_DAN_CONG_DONG = [
  "/cong-dong",
  "/bai",
  "/bep",
  "/cong-thuc",
  "/ho-so",
  "/doi-mat-khau",
  "/dang-nhap",
];

const DUONG_DAN_TRO_LY = ["/tro-ly", "/api/chat"];

const DUONG_DAN_DANG_TAT = [
  ...(CONG_DONG_BAT ? [] : DUONG_DAN_CONG_DONG),
  ...(TRO_LY_BAT ? [] : DUONG_DAN_TRO_LY),
];

/** Đường dẫn thuộc một tính năng đang tắt. */
export function laDuongDanDangTat(pathname: string): boolean {
  return DUONG_DAN_DANG_TAT.some(
    (goc) => pathname === goc || pathname.startsWith(`${goc}/`),
  );
}
