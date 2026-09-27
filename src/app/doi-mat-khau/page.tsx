import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PasswordForm } from "@/components/password-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Đổi mật khẩu · Tủ Lạnh Ra Món" };

export default async function DoiMatKhauPage() {
  // Link "quên mật khẩu" đi qua /auth/callback trước, nên tới đây là đã có
  // phiên. Không có phiên nghĩa là link hỏng hoặc hết hạn.
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?loi=het-han&next=/doi-mat-khau");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Đổi mật khẩu"
        subtitle={user.email ?? undefined}
        backHref="/ho-so"
      />
      <div className="px-4">
        <PasswordForm />
      </div>
    </div>
  );
}
