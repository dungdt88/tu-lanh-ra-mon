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
  /**
   * Phải phủ MỌI trang, không chỉ phần cộng đồng.
   *
   * `layout.tsx` gọi `getCongThucCuaToi()` trên mọi trang, tức là mọi trang đều
   * gọi `auth.getUser()`. Khi access token hết hạn, thư viện tự đi làm mới và
   * nhận refresh token mới — nhưng Server Component không ghi được cookie nên
   * token mới rơi mất, còn token cũ thì Supabase đã đánh dấu "đã dùng". Lần
   * sau vào là mất phiên. Middleware là chỗ duy nhất ghi được cookie mới, nên
   * nó phải chạy ở trang chủ, tủ lạnh, trang món... chứ không riêng cộng đồng.
   *
   * Đây là lý do thu hẹp matcher (bản 26/09) làm người dùng bị đăng xuất khi
   * reload — đừng thu hẹp lại lần nữa.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|gif|mp4|woff2?)$).*)",
  ],
};
