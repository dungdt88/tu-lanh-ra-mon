"use client";

import * as React from "react";
import Link from "next/link";
import { Camera, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { DishCard } from "@/components/dish-card";
import { MealPlanCard } from "@/components/meal-plan-card";
import { usePantry } from "@/lib/pantry-store";
import { buildMealPlans, rankDishes } from "@/lib/suggest";
import type { MealSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIME_FILTERS = [
  { label: "Bất kỳ", value: 0 },
  { label: "≤ 20 phút", value: 20 },
  { label: "≤ 30 phút", value: 30 },
  { label: "≤ 45 phút", value: 45 },
];

export default function SuggestPage() {
  const { set, items, hydrated } = usePantry();
  const [slot, setSlot] = React.useState<MealSlot>(
    new Date().getHours() < 14 ? "trua" : "toi",
  );
  const [maxMinutes, setMaxMinutes] = React.useState(0);

  const plans = React.useMemo(
    () =>
      buildMealPlans(set, {
        slot,
        maxMinutes: maxMinutes || undefined,
      }),
    [set, slot, maxMinutes],
  );

  const dishes = React.useMemo(
    () =>
      rankDishes(set, {
        slot,
        maxMinutes: maxMinutes || undefined,
        maxMissing: 1,
      }).slice(0, 12),
    [set, slot, maxMinutes],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hôm nay ăn gì"
        subtitle={
          hydrated
            ? `Dựa trên ${items.length} nguyên liệu trong tủ`
            : "Đang tải…"
        }
        backHref="/"
      />

      <div className="space-y-4 px-4">
        {hydrated && items.length === 0 && (
          <Card className="bg-accent/40 border-none">
            <CardContent className="flex items-center gap-3">
              <span className="text-2xl">🧊</span>
              <p className="flex-1 text-xs">
                Tủ lạnh chưa có gì nên đây là gợi ý chung. Quét tủ để gợi ý sát
                hơn.
              </p>
              <Button asChild size="sm">
                <Link href="/quet">
                  <Camera /> Quét
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={slot} onValueChange={(v) => setSlot(v as MealSlot)}>
          <TabsList className="w-full">
            <TabsTrigger value="trua" className="flex-1">
              Bữa trưa
            </TabsTrigger>
            <TabsTrigger value="toi" className="flex-1">
              Bữa tối
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <Clock3 className="text-muted-foreground size-4 shrink-0" />
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setMaxMinutes(filter.value)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
                  maxMinutes === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <TabsContent value={slot} className="mt-4 space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Mâm cơm gợi ý</h2>
              {plans.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Chưa dựng được mâm cơm với bộ lọc này. Thử nới thời gian nấu.
                </p>
              ) : (
                plans.map((plan, index) => (
                  <MealPlanCard key={plan.id} plan={plan} index={index} />
                ))
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Món lẻ hợp với tủ lạnh</h2>
              {dishes.map((match) => (
                <DishCard key={match.dish.id} match={match} />
              ))}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
