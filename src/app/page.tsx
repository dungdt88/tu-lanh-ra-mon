"use client";

import * as React from "react";
import Link from "next/link";
import { Camera, Clock, RefreshCw, ShoppingBasket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DishCard } from "@/components/dish-card";
import { MealPlanCard } from "@/components/meal-plan-card";
import { QuickPantry } from "@/components/quick-pantry";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABEL } from "@/data/dishes";
import { ingredientName } from "@/data/ingredients";
import { usePantry } from "@/lib/pantry-store";
import { useMounted } from "@/lib/use-mounted";
import { buildMealPlans, rankDishes } from "@/lib/suggest";
import type { MealSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: "trua", label: "Bữa trưa" },
  { value: "toi", label: "Bữa tối" },
];

export default function HomePage() {
  const { set, items, hydrated } = usePantry();
  const mounted = useMounted();
  const [chosenSlot, setChosenSlot] = React.useState<MealSlot | null>(null);
  const [offset, setOffset] = React.useState(0);
  const [showMore, setShowMore] = React.useState(false);

  // Trước 14h mặc định bữa trưa, sau đó là bữa tối.
  // Giờ chỉ đọc được ở client nên chờ mounted để không lệch lúc hydrate.
  const slot: MealSlot =
    chosenSlot ?? (mounted && new Date().getHours() >= 14 ? "toi" : "trua");

  const plans = React.useMemo(
    () => buildMealPlans(set, { slot, count: 5 }),
    [set, slot],
  );

  const featured = plans.length > 0 ? plans[offset % plans.length] : null;
  const others = plans.filter((p) => p.id !== featured?.id).slice(0, 2);

  const dishes = React.useMemo(
    () => rankDishes(set, { slot, maxMissing: 1 }).slice(0, 8),
    [set, slot],
  );

  return (
    <div className="space-y-5">
      <header className="bg-background/95 sticky top-0 z-30 border-b px-4 pt-3 pb-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-primary text-[10px] font-semibold tracking-wide uppercase">
              Tủ Lạnh Ra Món
            </p>
            <h1 className="truncate text-lg leading-tight font-bold xs:text-xl">
              Hôm nay ăn gì
            </h1>
          </div>
          <ThemeToggle />
          <Button asChild size="sm" className="shrink-0">
            <Link href="/quet" prefetch>
              <Camera />
              <span className="hidden xs:inline">Quét tủ</span>
            </Link>
          </Button>
        </div>

        <div className="bg-muted mt-3 flex rounded-full p-1">
          {SLOTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setChosenSlot(option.value)}
              className={cn(
                "min-h-9 flex-1 rounded-full text-sm font-medium transition-colors",
                slot === option.value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-5 px-4">
        <QuickPantry />

        {!hydrated ? (
          <Card>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        ) : (
          featured && (
            <Card className="border-primary/30 gap-3">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Mâm cơm gợi ý</p>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" />
                    {featured.minutes} phút
                  </Badge>
                </div>

                <div className="space-y-1">
                  {featured.dishes.map((match) => (
                    <Link
                      key={match.dish.id}
                      href={`/mon/${match.dish.slug}`}
                      prefetch
                      className="hover:bg-muted/60 -mx-2 flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 transition-colors active:scale-[0.99]"
                    >
                      <span className="bg-accent flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl">
                        {match.dish.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {match.dish.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {ROLE_LABEL[match.dish.role]} · {match.dish.minutes}{" "}
                          phút
                          {match.missing.length === 0 && " · đủ đồ"}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                {featured.missing.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                      <ShoppingBasket className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        Ghé chợ mua:{" "}
                        <span className="text-foreground font-medium">
                          {featured.missing.map(ingredientName).join(", ")}
                        </span>
                      </span>
                    </p>
                  </>
                )}

                <Button
                  variant="outline"
                  className="min-h-11 w-full"
                  onClick={() => setOffset((value) => value + 1)}
                >
                  <RefreshCw /> Đổi mâm khác
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {hydrated && items.length === 0 && (
          <p className="text-muted-foreground text-center text-xs">
            Đang gợi ý chung. Chạm nguyên liệu phía trên hoặc quét tủ để sát
            hơn.
          </p>
        )}

        {/* Màn nhỏ: gấp lại cho gọn. Màn lớn: hiện luôn vì còn nhiều chỗ trống */}
        {!showMore && (
          <Button
            variant="ghost"
            className="min-h-11 w-full md:hidden"
            onClick={() => setShowMore(true)}
          >
            Xem thêm mâm khác và món lẻ
          </Button>
        )}

        <div className={cn("space-y-6", !showMore && "hidden md:block")}>
          {others.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Mâm khác</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {others.map((plan, index) => (
                  <MealPlanCard key={plan.id} plan={plan} index={index + 1} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Món lẻ hợp với tủ lạnh</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {dishes.map((match) => (
                <DishCard key={match.dish.id} match={match} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
