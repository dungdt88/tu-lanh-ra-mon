import Link from "next/link";
import { CookingPot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth";
import { getFeed } from "@/lib/repo/feed";
import { hasSupabase } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Cộng đồng · Tủ Lạnh Ra Món",
  description: "Mâm cơm hôm nay của các bếp khác.",
};

export default async function CongDongPage({
  searchParams,
}: PageProps<"/cong-dong">) {
  const { loc } = await searchParams;
  const theoDoi = loc === "theo-doi";

  const from = theoDoi ? "/cong-dong?loc=theo-doi" : "/cong-dong";
  const user = await requireUser(from);

  const posts = await getFeed({
    viewerId: user.id,
    followingOf: theoDoi ? user.id : undefined,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cộng đồng"
        subtitle="Nhà người ta hôm nay ăn gì"
        action={
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/cong-dong/dang">
                <Plus className="size-4" /> Khoe món
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4 px-4">
        {!hasSupabase && (
          <p className="bg-muted rounded-xl p-3 text-sm">
            Chưa cấu hình Supabase nên cộng đồng đang trống. Điền key vào
            <code className="mx-1">.env.local</code>rồi chạy lại.
          </p>
        )}

        <div className="bg-muted flex gap-1 rounded-full p-1">
          {[
            { href: "/cong-dong", label: "Mới nhất", active: !theoDoi },
            {
              href: "/cong-dong?loc=theo-doi",
              label: "Đang theo dõi",
              active: theoDoi,
            },
          ].map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-9 flex-1 items-center justify-center rounded-full text-[13px] font-medium transition-colors xs:text-sm",
                tab.active
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="text-muted-foreground space-y-3 py-10 text-center">
            <CookingPot className="mx-auto size-10" />
            <p className="text-sm">
              {theoDoi
                ? "Chưa theo dõi bếp nào, hoặc các bếp đó chưa đăng gì."
                : "Chưa có ai khoe món. Nhà mình mở hàng nhé?"}
            </p>
            <Button asChild size="sm">
              <Link href="/cong-dong/dang">
                <Plus className="size-4" /> Khoe món đầu tiên
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} from={from} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
