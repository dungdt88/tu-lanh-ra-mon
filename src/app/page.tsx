"use client";

import * as React from "react";
import Link from "next/link";
import { Camera, Clock, RefreshCw, ShoppingBasket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DishCard } from "@/components/dish-card";
import { MealPlanCard } from "@/components/meal-plan-card";
import { QuickPantry } from "@/components/quick-pantry";
import { ROLE_LABEL } from "@/data/dishes";
import { ingredientName } from "@/data/ingredients";
import { usePantry } from "@/lib/pantry-store";
import { buildMealPlans, rankDishes } from "@/lib/suggest";
import type { MealSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: "trua", label: "Bữa trưa" },
  { value: "toi", label: "Bữa tối" },
];

export default function HomePage() {
  const { set, items, hydrated } = usePantry();
  const [slot, setSlot] = React.useState<MealSlot>(
    new Date().getHours() < 14 ? "trua" : "toi",
  );
  const [offset, setOffset] = React.useState(0);
  const [showMore, setShowMore] = React.useState(false);

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
      <header className="bg-background/95 sticky top-0 z-30 border-b px-4 pt-4 pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-primary text-[11px] font-semibold tracking-wide uppercase">
              Tủ Lạnh Ra Món
            </p>
            <h1 className="text-xl leading-tight font-bold">Hôm nay ăn gì</h1>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/quet" prefetch>
              <Camera /> Quét tủ
            </Link>
          </Button>
        </div>

        <div className="bg-muted mt-3 flex rounded-full p-1">
          {SLOTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSlot(option.value)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-sm font-medium transition-colors",
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

        {featured && (
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
                    className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-xl px-2 py-2"
                  >
                    <span className="bg-accent flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl">
                      {match.dish.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {match.dish.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
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
                className="w-full"
                onClick={() => setOffset((value) => value + 1)}
              >
                <RefreshCw /> Đổi mâm khác
              </Button>
            </CardContent>
          </Card>
        )}

        {hydrated && items.length === 0 && (
          <p className="text-muted-foreground text-center text-xs">
            Đang gợi ý chung. Chạm nguyên liệu phía trên hoặc quét tủ để sát
            hơn.
          </p>
        )}

        {!showMore ? (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowMore(true)}
          >
            Xem thêm mâm khác và món lẻ
          </Button>
        ) : (
          <>
            {others.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">Mâm khác</h2>
                {others.map((plan, index) => (
                  <MealPlanCard key={plan.id} plan={plan} index={index + 1} />
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Món lẻ hợp với tủ lạnh</h2>
              {dishes.map((match) => (
                <DishCard key={match.dish.id} match={match} />
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
