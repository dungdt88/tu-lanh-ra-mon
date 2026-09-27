/**
 * Đổi lỗi tiếng Anh của Supabase Auth sang câu người dùng đọc hiểu.
 *
 * Supabase trả message tiếng Anh và cố tình mơ hồ ở vài chỗ (sai mật khẩu và
 * sai email đều là "Invalid login credentials") - giữ nguyên sự mơ hồ đó,
 * đừng nói rõ email nào đã có tài khoản.
 */
export function thongBaoLoi(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (m.includes("email not confirmed")) {
    return "Email chưa được xác minh. Bấm link trong email đã gửi cho bạn.";
  }
  if (m.includes("password should be at least")) {
    return "Mật khẩu phải từ 8 ký tự trở lên.";
  }
  if (m.includes("user already registered")) {
    return "Email này đã có tài khoản. Đăng nhập bằng mật khẩu, hoặc bấm “Quên mật khẩu”.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Gửi hơi nhiều lần rồi, đợi một lát rồi thử lại.";
  }
  if (m.includes("provider is not enabled")) {
    return "Cách đăng nhập này chưa được bật trong Supabase.";
  }
  if (m.includes("token has expired") || m.includes("invalid token")) {
    return "Mã hoặc link đã hết hạn. Gửi lại cái mới nhé.";
  }

  return message;
}
