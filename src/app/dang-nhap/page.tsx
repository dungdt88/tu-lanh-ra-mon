import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

const LOI: Record<string, string> = {
  "het-han":
    "Link đăng nhập đã hết hạn hoặc đã dùng rồi. Gửi lại link mới nhé.",
  "chua-cau-hinh": "Chưa cấu hình Supabase nên chưa đăng nhập được.",
  oauth:
    "Chưa đăng nhập được bằng Google/Facebook. Thử lại, hoặc dùng email cũng được.",
};

export const metadata = { title: "Đăng nhập · Tủ Lạnh Ra Món" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/dang-nhap">) {
  const { next, loi } = await searchParams;
  const target =
    typeof next === "string" && next.startsWith("/") ? next : "/cong-dong";

  const user = await getCurrentUser();
  if (user) redirect(target);

  const message = typeof loi === "string" ? LOI[loi] : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Đăng nhập"
        subtitle="Để khoe mâm cơm và theo dõi bếp nhà khác"
        backHref="/cong-dong"
      />

      <div className="space-y-4 px-4">
        {message && (
          <p className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
            {message}
          </p>
        )}
        <LoginForm next={target} />
      </div>
    </div>
  );
}
