"use client";

import Link from "next/link";
import { Check, RefreshCw, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABEL } from "@/data/dishes";
import { duongDanMon } from "@/lib/dish-link";
import { useCatalog } from "@/lib/catalog-context";
import type { MealPlan } from "@/lib/types";

/**
 * Mâm cơm đang gợi ý - thứ duy nhất người dùng mở app để xem.
 *
 * Cố tình nổi hơn hẳn `MealPlanCard`: cùng một kiểu thẻ thì mắt không biết đọc
 * cái nào trước, mà trang này chỉ có một câu trả lời.
 */
export function FeaturedPlanCard({
  plan,
  viTri,
  tong,
  onDoiMam,
}: {
  plan: MealPlan;
  /** Đang xem mâm thứ mấy, đếm từ 1 */
  viTri: number;
  tong: number;
  onDoiMam: () => void;
}) {
  const { ingredientName } = useCatalog();
  const duDo = plan.missing.length === 0;

  return (
    <Card className="border-primary/40 gap-0 py-0 shadow-sm">
      <div className="bg-accent/40 flex items-center gap-2 rounded-t-xl border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-primary text-[10px] font-semibold tracking-wide uppercase">
            Mâm cơm gợi ý
          </p>
          <p className="text-base leading-tight font-bold">
            {plan.dishes.length} món · {plan.minutes} phút
          </p>
        </div>
      </div>

      <CardContent className="space-y-3 px-4 py-3">
        <div className="space-y-1">
          {plan.dishes.map((match) => (
            <Link
              key={match.dish.id}
              href={duongDanMon(match.dish)}
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
                  {ROLE_LABEL[match.dish.role]} · {match.dish.minutes} phút
                </span>
              </span>
              {match.missing.length === 0 && (
                <Check className="text-accent-foreground size-4 shrink-0" />
              )}
            </Link>
          ))}
        </div>

        <Separator />

        {/* Câu trả lời thật sự cho "có nấu được luôn không" - để ngay trên nút */}
        {duDo ? (
          <p className="text-accent-foreground flex items-center gap-1.5 text-sm font-medium">
            <Check className="size-4 shrink-0" />
            Nấu được ngay, không phải đi chợ
          </p>
        ) : (
          <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
            <ShoppingBasket className="mt-0.5 size-4 shrink-0" />
            <span>
              Cần mua thêm{" "}
              <span className="text-foreground font-medium">
                {plan.missing.map(ingredientName).join(", ")}
              </span>
            </span>
          </p>
        )}

        <p className="text-muted-foreground text-xs">
          ~{Math.round(plan.nutrition.kcal)} kcal · {plan.nutrition.protein}g
          đạm / suất
        </p>
      </CardContent>

      {tong > 1 && (
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            className="min-h-11 w-full justify-between"
            onClick={onDoiMam}
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4" /> Đổi mâm khác
            </span>
            {/* Nói rõ đang ở đâu: không có số thì bấm mãi không biết còn bao nhiêu */}
            <span className="text-muted-foreground text-xs font-normal">
              {viTri}/{tong}
            </span>
          </Button>
        </div>
      )}
    </Card>
  );
}
