"use client";

import Link from "next/link";
import { Clock, ShoppingBasket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABEL } from "@/data/dishes";
import { useCatalog } from "@/lib/catalog-context";
import type { MealPlan } from "@/lib/types";

export function MealPlanCard({
  plan,
  index,
}: {
  plan: MealPlan;
  index: number;
}) {
  const { ingredientName } = useCatalog();

  return (
    <Card className="gap-3">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Mâm cơm {index + 1}</CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {plan.minutes} phút
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          ~{Math.round(plan.nutrition.kcal)} kcal · {plan.nutrition.protein}g
          đạm / suất
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        {plan.dishes.map((match) => (
          <Link
            key={match.dish.id}
            href={`/mon/${match.dish.slug}`}
            className="hover:bg-muted/60 -mx-2 flex min-h-12 items-center gap-3 rounded-lg px-2 py-2 transition-colors"
          >
            <span className="text-xl">{match.dish.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {match.dish.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {ROLE_LABEL[match.dish.role]} · {match.dish.minutes} phút
              </span>
            </span>
            {match.missing.length === 0 && (
              <Badge
                variant="outline"
                className="border-emerald-200 text-[10px] text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
              >
                đủ đồ
              </Badge>
            )}
          </Link>
        ))}

        {plan.missing.length > 0 && (
          <>
            <Separator />
            <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
              <ShoppingBasket className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Ghé chợ mua:{" "}
                <span className="text-foreground font-medium">
                  {plan.missing.map(ingredientName).join(", ")}
                </span>
              </span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
