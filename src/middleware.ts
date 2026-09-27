import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { hasSupabase } from "@/lib/supabase/env";

/** Phần cộng đồng: phải đăng nhập mới xem được, kể cả chỉ đọc. */
const CAN_DANG_NHAP = [
  "/cong-dong",
  "/bai",
  "/bep",
  "/cong-thuc",
  "/ho-so",
  "/doi-mat-khau",
];

function chanKhach(pathname: string): boolean {
  // Ảnh xem trước của link chia sẻ vẫn phải mở: Zalo/Facebook đi lấy ảnh mà
  // gặp trang đăng nhập thì link dán ra không có thẻ.
  if (pathname.includes("/opengraph-image")) return false;

  return CAN_DANG_NHAP.some(
    (goc) => pathname === goc || pathname.startsWith(`${goc}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Chưa cấu hình Supabase thì không ai đăng nhập được - chặn lúc này chỉ làm
  // app chết cứng, để trang tự hiện lời nhắn "chưa cấu hình" thì rõ hơn.
  if (!hasSupabase || user) return response;

  const { pathname, search } = request.nextUrl;
  if (!chanKhach(pathname)) return response;

  const dich = request.nextUrl.clone();
  dich.pathname = "/dang-nhap";
  dich.search = "";
  dich.searchParams.set("next", `${pathname}${search}`);

  // Chuyển hướng mà bỏ cookie vừa làm mới thì lần sau lại phải làm mới nữa.
  const chuyenHuong = NextResponse.redirect(dich);
  response.cookies
    .getAll()
    .forEach((cookie) => chuyenHuong.cookies.set(cookie));

  return chuyenHuong;
}

export const config = {
  // Chỉ những trang thực sự cần biết ai đang đăng nhập. Mỗi lần chạy
  // middleware là một lượt gọi mạng tới Supabase, mà trang chủ, tủ lạnh và
  // trợ lý vẫn dùng được khi chưa đăng nhập.
  matcher: [
    "/cong-dong/:path*",
    "/bai/:path*",
    "/bep/:path*",
    "/cong-thuc/:path*",
    "/ho-so/:path*",
    "/doi-mat-khau",
    "/dang-nhap",
    "/auth/:path*",
  ],
};
