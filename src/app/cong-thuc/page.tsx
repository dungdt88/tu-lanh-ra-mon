import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABEL } from "@/data/dishes";
import { getCurrentUser } from "@/lib/auth";
import { getCongThucCuaToi } from "@/lib/repo/recipe";

export const metadata = { title: "Công thức nhà mình · Tủ Lạnh Ra Món" };

export default async function CongThucPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/cong-thuc");

  const congThuc = await getCongThucCuaToi();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Công thức nhà mình"
        subtitle="Món tự viết, gợi ý chung với danh mục"
        backHref="/ho-so"
        action={
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/cong-thuc/moi">
                <Plus className="size-4" /> Viết
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-3 px-4">
        {congThuc.length === 0 ? (
          <div className="text-muted-foreground space-y-3 py-10 text-center">
            <BookOpen className="mx-auto size-10" />
            <p className="text-sm">
              Chưa có công thức nào. Viết món tủ của nhà mình, app sẽ gợi ý nó
              chung với danh mục.
            </p>
            <Button asChild size="sm">
              <Link href="/cong-thuc/moi">
                <Plus className="size-4" /> Viết công thức đầu tiên
              </Link>
            </Button>
          </div>
        ) : (
          congThuc.map((mon) => (
            <Card key={mon.recipeId} className="gap-0 overflow-hidden p-0">
              <Link
                href={`/cong-thuc/${mon.recipeId}`}
                className="flex items-start gap-3 p-4"
              >
                <span className="bg-accent flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl">
                  {mon.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{mon.name}</span>
                    {!mon.isPublic && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Riêng
                      </Badge>
                    )}
                  </span>
                  {mon.summary && (
                    <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
                      {mon.summary}
                    </span>
                  )}
                  <span className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {mon.minutes} phút
                    </span>
                    <span>{ROLE_LABEL[mon.role]}</span>
                  </span>
                </span>
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
