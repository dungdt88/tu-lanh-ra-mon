import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Đích đến của link trong email đăng nhập.
 *
 * Supabase gửi `code` (luồng PKCE) hoặc `token_hash` + `type` tuỳ cấu hình
 * email template của project, nên nhận cả hai.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  // Google/Facebook báo lỗi hoặc người dùng bấm "Huỷ" thì quay về đây kèm
  // error chứ không kèm code.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=oauth`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=chua-cau-hinh`);
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: { message: "thiếu tham số" } };

  if (error) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=het-han`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
