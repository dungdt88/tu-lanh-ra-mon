"use client";

import Link from "next/link";
import { Clock, Flame, ShoppingBasket, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ROLE_LABEL } from "@/data/dishes";
import { useCatalog } from "@/lib/catalog-context";
import { duongDanMon } from "@/lib/dish-link";
import type { DishMatch } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DishCard({
  match,
  className,
  showRole = true,
}: {
  match: DishMatch;
  className?: string;
  showRole?: boolean;
}) {
  const { ingredientName } = useCatalog();
  const { dish, missing, coverage } = match;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden p-0 transition-colors active:scale-[0.99]",
        className,
      )}
    >
      <Link href={duongDanMon(dish)} className="block p-4">
        <div className="flex items-start gap-3">
          <div className="bg-accent flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl">
            {dish.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{dish.name}</h3>
              {showRole && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {ROLE_LABEL[dish.role]}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
              {dish.summary}
            </p>

            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {dish.minutes} phút
              </span>
              {dish.nutrition.kcal > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="size-3.5" /> {dish.nutrition.kcal} kcal
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="size-3.5" /> {dish.servings} người
              </span>
            </div>

            {missing.length === 0 ? (
              <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Nấu được ngay với đồ đang có
              </p>
            ) : (
              <p className="text-muted-foreground mt-2 flex items-start gap-1 text-xs">
                <ShoppingBasket className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Cần mua thêm:{" "}
                  <span className="text-foreground font-medium">
                    {missing.map(ingredientName).join(", ")}
                  </span>
                </span>
              </p>
            )}

            <div className="bg-muted mt-2 h-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.round(coverage * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
