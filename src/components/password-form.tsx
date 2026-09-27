"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { thongBaoLoi } from "@/lib/auth-loi";
import { createClient } from "@/lib/supabase/client";

/**
 * Đặt mật khẩu mới cho phiên đang đăng nhập.
 *
 * Dùng cho cả hai đường: vừa bấm link "quên mật khẩu" (link đó tạo ra một phiên
 * tạm), và người đang đăng nhập muốn đổi mật khẩu.
 */
export function PasswordForm() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const [matKhau, setMatKhau] = React.useState("");
  const [nhacLai, setNhacLai] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [xong, setXong] = React.useState(false);

  if (!supabase) {
    return (
      <p className="text-muted-foreground text-sm">
        Chưa cấu hình Supabase nên chưa đổi được mật khẩu.
      </p>
    );
  }

  const client = supabase;
  const lechNhau = nhacLai.length > 0 && matKhau !== nhacLai;

  async function luu(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error } = await client.auth.updateUser({ password: matKhau });

    setBusy(false);
    if (error) {
      setError(thongBaoLoi(error.message));
      return;
    }

    setXong(true);
    router.refresh();
  }

  if (xong) {
    return (
      <div className="space-y-4">
        <p className="bg-accent/50 rounded-xl p-4 text-sm">
          Đã đổi mật khẩu. Lần sau đăng nhập bằng mật khẩu mới nhé.
        </p>
        <Button className="w-full" onClick={() => router.push("/cong-dong")}>
          Về cộng đồng
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={luu} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mat-khau-moi">Mật khẩu mới</Label>
        <Input
          id="mat-khau-moi"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
          placeholder="Từ 8 ký tự"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nhac-lai">Nhập lại</Label>
        <Input
          id="nhac-lai"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={nhacLai}
          onChange={(e) => setNhacLai(e.target.value)}
        />
        {lechNhau && (
          <p className="text-destructive text-xs">Hai ô chưa giống nhau.</p>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={busy || matKhau.length < 8 || lechNhau || !nhacLai}
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        Lưu mật khẩu
      </Button>
    </form>
  );
}
