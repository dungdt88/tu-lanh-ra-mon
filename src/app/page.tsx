"use client";

import Link from "next/link";
import { Camera, ChefHat, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DishCard } from "@/components/dish-card";
import { usePantry } from "@/lib/pantry-store";
import { rankDishes } from "@/lib/suggest";
import { getIngredient } from "@/data/ingredients";

function currentSlot(): "trua" | "toi" {
  return new Date().getHours() < 14 ? "trua" : "toi";
}

export default function HomePage() {
  const { items, set, hydrated } = usePantry();
  const slot = currentSlot();
  const quick = rankDishes(set, { slot, maxMinutes: 30 }).slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="from-primary/12 bg-linear-to-b to-transparent px-4 pt-8 pb-6">
        <p className="text-primary text-xs font-semibold tracking-wide uppercase">
          Tủ Lạnh Ra Món
        </p>
        <h1 className="mt-1 text-2xl leading-tight font-bold">
          Tan làm 5h, 6h30 cả nhà có cơm nóng.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Chụp một tấm tủ lạnh — app lo phần nghĩ hôm nay ăn gì, đủ chất và
          không lặp món.
        </p>

        <div className="mt-4 flex gap-2">
          <Button asChild size="lg" className="flex-1">
            <Link href="/quet">
              <Camera /> Quét tủ lạnh
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tu-lanh">Chọn tay</Link>
          </Button>
        </div>
      </section>

      <section className="px-4">
        <Card className="bg-accent/40 border-none">
          <CardContent className="flex items-center gap-3">
            <div className="bg-background flex size-11 items-center justify-center rounded-xl text-xl">
              🧊
            </div>
            <div className="min-w-0 flex-1">
              {!hydrated ? (
                <Skeleton className="h-9 w-full" />
              ) : items.length === 0 ? (
                <>
                  <p className="text-sm font-medium">Tủ lạnh đang trống</p>
                  <p className="text-muted-foreground text-xs">
                    Thêm vài nguyên liệu để nhận gợi ý sát hơn.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Đang có {items.length} nguyên liệu
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {items
                      .slice(0, 6)
                      .map((id) => getIngredient(id)?.name ?? id)
                      .join(", ")}
                    {items.length > 6 ? "…" : ""}
                  </p>
                </>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tu-lanh">Sửa</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="text-primary size-4" />
            Gợi ý nhanh cho bữa {slot === "trua" ? "trưa" : "tối"}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/goi-y">Xem mâm cơm</Link>
          </Button>
        </div>

        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Clock3 className="size-3.5" /> Ưu tiên món dưới 30 phút
        </p>

        <div className="space-y-3">
          {quick.map((match) => (
            <DishCard key={match.dish.id} match={match} />
          ))}
        </div>

        <Button asChild variant="secondary" className="w-full">
          <Link href="/goi-y">
            <ChefHat /> Lên mâm cơm hôm nay
          </Link>
        </Button>
      </section>
    </div>
  );
}
