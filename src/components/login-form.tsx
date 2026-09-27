"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { thongBaoLoi } from "@/lib/auth-loi";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Cach = "mat-khau" | "link";
type ViecMatKhau = "dang-nhap" | "dang-ky" | "quen";

/** Màn "đã gửi email, đi kiểm tra hộp thư" - mỗi luồng một lời nhắn khác nhau */
type DaGui = "xac-minh" | "link-dang-nhap" | "dat-lai";

const NHAN_VIEC: Record<ViecMatKhau, string> = {
  "dang-nhap": "Đăng nhập",
  "dang-ky": "Tạo tài khoản",
  quen: "Gửi link đặt lại mật khẩu",
};

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const [cach, setCach] = React.useState<Cach>("mat-khau");
  const [viec, setViec] = React.useState<ViecMatKhau>("dang-nhap");
  const [daGui, setDaGui] = React.useState<DaGui | null>(null);

  const [email, setEmail] = React.useState("");
  const [matKhau, setMatKhau] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!supabase) {
    return (
      <p className="text-muted-foreground text-sm">
        Chưa cấu hình Supabase nên chưa đăng nhập được. Điền
        <code className="mx-1">NEXT_PUBLIC_SUPABASE_URL</code>và
        <code className="mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        vào <code>.env.local</code> rồi chạy lại.
      </p>
    );
  }

  const client = supabase;

  /** Mọi email của Supabase đều quay về đây; `next` quyết định đi tiếp đâu. */
  function duongDanVe(diTiep: string) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(diTiep)}`;
  }

  function batDau() {
    setBusy(true);
    setError(null);
  }

  function xong(loi: { message: string } | null, ketQua?: DaGui) {
    setBusy(false);
    if (loi) {
      setError(thongBaoLoi(loi.message));
      return false;
    }
    if (ketQua) setDaGui(ketQua);
    return true;
  }

  function veTrangDich() {
    router.replace(next);
    router.refresh();
  }

  async function dangNhapOAuth(provider: "google" | "facebook") {
    batDau();
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: duongDanVe(next) },
    });
    // Không có lỗi thì trình duyệt đã rời trang, không cần tắt trạng thái chờ.
    if (error) xong(error);
  }

  async function guiLinkDangNhap(event: React.FormEvent) {
    event.preventDefault();
    batDau();
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: duongDanVe(next) },
    });
    xong(error, "link-dang-nhap");
  }

  async function dangNhapBangMa(event: React.FormEvent) {
    event.preventDefault();
    batDau();
    const { error } = await client.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (xong(error)) veTrangDich();
  }

  async function guiFormMatKhau(event: React.FormEvent) {
    event.preventDefault();
    batDau();

    if (viec === "dang-nhap") {
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: matKhau,
      });
      if (xong(error)) veTrangDich();
      return;
    }

    if (viec === "dang-ky") {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: matKhau,
        options: { emailRedirectTo: duongDanVe(next) },
      });

      // Project bật "Confirm email" thì signUp trả user nhưng không có session;
      // tắt xác minh thì có session luôn và vào thẳng được.
      if (!xong(error)) return;
      if (data.session) veTrangDich();
      else setDaGui("xac-minh");
      return;
    }

    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: duongDanVe("/doi-mat-khau"),
    });
    xong(error, "dat-lai");
  }

  function lamLai() {
    setDaGui(null);
    setCode("");
    setMatKhau("");
    setError(null);
  }

  if (daGui === "link-dang-nhap") {
    return (
      <form onSubmit={dangNhapBangMa} className="space-y-4">
        <div className="bg-accent/50 rounded-xl p-4 text-sm">
          Đã gửi email tới <span className="font-medium">{email}</span>. Bấm
          link trong email là xong. Mở email ở máy khác thì nhập mã 6 số trong
          đó vào đây.
        </div>

        <div className="space-y-2">
          <Label htmlFor="ma">Mã 6 số</Label>
          <Input
            id="ma"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={busy || code.length < 6}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          Đăng nhập
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={lamLai}
        >
          Đổi email khác
        </Button>
      </form>
    );
  }

  if (daGui) {
    return (
      <div className="space-y-4">
        <div className="bg-accent/50 rounded-xl p-4 text-sm">
          {daGui === "xac-minh" ? (
            <>
              Đã gửi email xác minh tới{" "}
              <span className="font-medium">{email}</span>. Bấm link trong đó
              rồi quay lại đăng nhập.
            </>
          ) : (
            <>
              Nếu <span className="font-medium">{email}</span> có tài khoản,
              link đặt lại mật khẩu đã được gửi tới đó.
            </>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            lamLai();
            setViec("dang-nhap");
          }}
        >
          Quay lại đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => dangNhapOAuth("google")}
        >
          Tiếp tục với Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => dangNhapOAuth("facebook")}
        >
          Tiếp tục với Facebook
        </Button>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        hoặc dùng email
        <span className="bg-border h-px flex-1" />
      </div>

      <div className="bg-muted flex gap-1 rounded-full p-1">
        {(
          [
            { id: "mat-khau", label: "Mật khẩu" },
            { id: "link", label: "Link qua email" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setCach(tab.id);
              setError(null);
            }}
            aria-pressed={cach === tab.id}
            className={cn(
              "xs:text-sm flex min-h-9 flex-1 items-center justify-center rounded-full text-[13px] font-medium transition-colors",
              cach === tab.id
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {cach === "link" ? (
        <form onSubmit={guiLinkDangNhap} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-link">Email</Label>
            <Input
              id="email-link"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@email.com"
            />
            <p className="text-muted-foreground text-xs">
              Không cần mật khẩu. Nhận link đăng nhập qua email.
            </p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={busy || !email.trim()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Gửi link đăng nhập
          </Button>
        </form>
      ) : (
        <form onSubmit={guiFormMatKhau} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@email.com"
            />
          </div>

          {viec !== "quen" && (
            <div className="space-y-2">
              <Label htmlFor="mat-khau">Mật khẩu</Label>
              <Input
                id="mat-khau"
                type="password"
                required
                minLength={8}
                autoComplete={
                  viec === "dang-ky" ? "new-password" : "current-password"
                }
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                placeholder={viec === "dang-ky" ? "Từ 8 ký tự" : undefined}
              />
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={
              busy || !email.trim() || (viec !== "quen" && matKhau.length < 8)
            }
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {NHAN_VIEC[viec]}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground min-h-9"
              onClick={() => {
                setViec(viec === "dang-ky" ? "dang-nhap" : "dang-ky");
                setError(null);
              }}
            >
              {viec === "dang-ky"
                ? "Đã có tài khoản? Đăng nhập"
                : "Chưa có tài khoản? Đăng ký"}
            </button>

            {viec !== "quen" && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground min-h-9"
                onClick={() => {
                  setViec("quen");
                  setError(null);
                }}
              >
                Quên mật khẩu?
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
