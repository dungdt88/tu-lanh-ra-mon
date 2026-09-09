"use client";

import { Check, Clock, Flame, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABEL } from "@/data/dishes";
import { getIngredient } from "@/data/ingredients";
import { usePantry } from "@/lib/pantry-store";
import type { Dish } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIFFICULTY_LABEL = ["Rất dễ", "Vừa tay", "Cần chút nghề"];

export function DishDetail({ dish }: { dish: Dish }) {
  const { has, add, hydrated } = usePantry();

  const rows = [
    ...dish.core.map((id) => ({ id, required: true })),
    ...dish.optional.map((id) => ({ id, required: false })),
  ];
  const missing = dish.core.filter(
    (id) => hydrated && !has(id) && !getIngredient(id)?.staple,
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={dish.name}
        subtitle={ROLE_LABEL[dish.role]}
        backHref="/"
        action={<ThemeToggle />}
      />

      <div className="space-y-5 px-4">
        <div className="bg-accent/50 flex items-center gap-4 rounded-2xl p-4">
          <span className="text-4xl">{dish.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm">{dish.summary}</p>
            <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {dish.minutes} phút
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" /> {dish.servings} người
              </span>
              <span className="flex items-center gap-1">
                <Flame className="size-3.5" /> {dish.nutrition.kcal} kcal/suất
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">
            {DIFFICULTY_LABEL[dish.difficulty - 1]}
          </Badge>
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="shrink-0 text-sm font-semibold">Nguyên liệu</h2>
              {hydrated && missing.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => add(...missing)}
                >
                  <Plus />
                  <span className="xs:hidden">Đã mua</span>
                  <span className="xs:inline hidden">Đánh dấu đã mua</span>
                </Button>
              )}
            </div>

            <ul className="space-y-1.5">
              {rows.map(({ id, required }) => {
                const ingredient = getIngredient(id);
                const owned = hydrated && (has(id) || ingredient?.staple);
                return (
                  <li
                    key={`${id}-${required}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border text-[10px]",
                        owned
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "text-muted-foreground border-dashed",
                      )}
                    >
                      {owned ? <Check className="size-3" /> : "?"}
                    </span>
                    <span className={cn(!required && "text-muted-foreground")}>
                      {ingredient?.emoji} {ingredient?.name ?? id}
                      {!required && " (tuỳ chọn)"}
                    </span>
                  </li>
                );
              })}
            </ul>

            {hydrated && missing.length > 0 && (
              <>
                <Separator />
                <p className="text-muted-foreground text-xs">
                  Còn thiếu{" "}
                  <span className="text-foreground font-medium">
                    {missing
                      .map((id) => getIngredient(id)?.name ?? id)
                      .join(", ")}
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Các bước</h2>
          <ol className="space-y-3">
            {dish.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {dish.tip && (
          <Card className="bg-secondary border-none">
            <CardContent className="text-sm">
              <span className="font-semibold">Mẹo: </span>
              {dish.tip}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="grid grid-cols-4 gap-2 text-center">
            {[
              ["Kcal", dish.nutrition.kcal],
              ["Đạm", `${dish.nutrition.protein}g`],
              ["Tinh bột", `${dish.nutrition.carb}g`],
              ["Béo", `${dish.nutrition.fat}g`],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-sm font-semibold">{value}</p>
                <p className="text-muted-foreground text-[11px]">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
