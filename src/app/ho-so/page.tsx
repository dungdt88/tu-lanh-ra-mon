import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Hồ sơ · Tủ Lạnh Ra Món" };

export default async function HoSoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/ho-so");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hồ sơ"
        subtitle={user.email ?? undefined}
        backHref="/cong-dong"
      />

      <div className="space-y-6 px-4">
        <ProfileForm profile={user.profile} />

        <Link
          href="/cong-thuc"
          className="hover:bg-muted/60 flex min-h-14 items-center gap-3 rounded-xl border px-3"
        >
          <BookOpen className="text-muted-foreground size-5" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              Công thức nhà mình
            </span>
            <span className="text-muted-foreground block text-xs">
              Món tự viết, gợi ý chung với danh mục
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-4" />
        </Link>

        <form action="/auth/dang-xuat" method="post">
          <Button type="submit" variant="ghost" className="w-full">
            <LogOut className="size-4" /> Đăng xuất
          </Button>
        </form>
      </div>
    </div>
  );
}
