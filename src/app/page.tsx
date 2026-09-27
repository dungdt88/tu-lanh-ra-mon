"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DishCard } from "@/components/dish-card";
import { FeaturedPlanCard } from "@/components/featured-plan-card";
import { MealPlanCard } from "@/components/meal-plan-card";
import { QuickPantry } from "@/components/quick-pantry";
import { ScanResultBanner } from "@/components/scan-result-banner";
import { ScanUploader } from "@/components/scan-uploader";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCatalog } from "@/lib/catalog-context";
import { usePantry } from "@/lib/pantry-store";
import { useChatStore } from "@/lib/chat-store";
import { applyOverrides, filterByAvoid } from "@/lib/dish-override";
import { useMounted } from "@/lib/use-mounted";
import { buildMealPlans, rankDishes, stapleIds } from "@/lib/suggest";
import type { MealSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: "sang", label: "Bữa sáng" },
  { value: "trua", label: "Bữa trưa" },
  { value: "toi", label: "Bữa tối" },
];

/** Trước 10h gợi ý bữa sáng, trước 14h là bữa trưa, còn lại là bữa tối */
function slotTheoGio(hour: number): MealSlot {
  if (hour < 10) return "sang";
  if (hour < 14) return "trua";
  return "toi";
}

export default function HomePage() {
  const { set, items, hydrated } = usePantry();
  const { dishes: rawDishes, ingredients } = useCatalog();
  const { overrides, prefs, hydrated: chatHydrated } = useChatStore();

  // Món đã được trợ lý chỉnh, và bỏ những món dùng nguyên liệu cả nhà cần tránh.
  // Chờ chatHydrated để nội dung server và client khớp nhau lúc hydrate.
  const allDishes = React.useMemo(
    () =>
      chatHydrated
        ? filterByAvoid(applyOverrides(rawDishes, overrides), prefs.avoid)
        : rawDishes,
    [rawDishes, overrides, prefs.avoid, chatHydrated],
  );
  const staples = React.useMemo(() => stapleIds(ingredients), [ingredients]);
  const mounted = useMounted();
  const [chosenSlot, setChosenSlot] = React.useState<MealSlot | null>(null);
  const [offset, setOffset] = React.useState(0);
  const [showMore, setShowMore] = React.useState(false);
  const [vuaQuet, setVuaQuet] = React.useState<number | null>(null);
  const goiYRef = React.useRef<HTMLDivElement>(null);

  // Quét xong thì đưa mắt về mâm cơm vừa tính lại, kèm một dòng xác nhận -
  // ScanUploader reset sạch nên không còn dấu vết nào của lần quét.
  function xemGoiY(soLuong: number) {
    setOffset(0);
    setVuaQuet(soLuong);
    goiYRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Giờ chỉ đọc được ở client nên chờ mounted để không lệch lúc hydrate.
  const slot: MealSlot =
    chosenSlot ?? (mounted ? slotTheoGio(new Date().getHours()) : "trua");

  // Bữa sáng không dựng mâm mặn + canh + rau, chỉ gợi ý món đơn
  const laBuaSang = slot === "sang";

  const plans = React.useMemo(
    () => buildMealPlans(allDishes, set, staples, { slot, count: 5 }),
    [allDishes, set, staples, slot],
  );

  const featured = plans.length > 0 ? plans[offset % plans.length] : null;
  const others = plans.filter((p) => p.id !== featured?.id).slice(0, 2);

  const dishes = React.useMemo(
    () =>
      rankDishes(allDishes, set, staples, {
        slot,
        // Món sáng chỉ 1-2 nguyên liệu nên nới ra cho có cái mà chọn
        maxMissing: laBuaSang ? 2 : 1,
      }).slice(0, 8),
    [allDishes, set, staples, slot, laBuaSang],
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
        </div>

        <div className="bg-muted mt-3 flex rounded-full p-1">
          {SLOTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setChosenSlot(option.value)}
              className={cn(
                "xs:text-sm min-h-9 flex-1 rounded-full px-1 text-[13px] font-medium transition-colors",
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
        {/* Câu trả lời đứng trước mọi thứ khác: mở app là thấy ngay, quét xong
            cuộn về đây cũng thấy ngay. Ô tải ảnh và hàng chip là cách chỉnh cho
            sát hơn, nên nằm sau. */}
        <div ref={goiYRef} className="scroll-mt-28" />

        {/* 0 nguyên liệu thì không có gì để xác nhận - ScanUploader đã tự nói
            là không nhận ra gì trong ảnh */}
        {vuaQuet !== null && vuaQuet > 0 && (
          <ScanResultBanner soLuong={vuaQuet} onDong={() => setVuaQuet(null)} />
        )}

        {!hydrated ? (
          <Card>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        ) : laBuaSang ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Món sáng gợi ý</h2>
            {dishes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Chưa có món sáng nào hợp với tủ lạnh. Thử thêm trứng, bánh mì
                hoặc mì gói.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {dishes.map((match) => (
                  <DishCard
                    key={match.dish.id}
                    match={match}
                    showRole={false}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          featured && (
            <FeaturedPlanCard
              plan={featured}
              viTri={(offset % plans.length) + 1}
              tong={plans.length}
              onDoiMam={() => setOffset((value) => value + 1)}
            />
          )
        )}

        {/* Tủ lạnh trống thì gợi ý chỉ là phỏng đoán - nói thẳng và chỉ việc cần
            làm, thay vì một dòng chú thích mờ dưới đáy thẻ */}
        {hydrated && items.length === 0 && (
          <p className="text-muted-foreground text-center text-xs">
            Đang gợi ý chung cho cả nhà. Quét tủ lạnh hoặc chạm nguyên liệu bên
            dưới để sát hơn.
          </p>
        )}

        {/* Hai cách chỉnh cho sát hơn, đứng sau câu trả lời */}
        <ScanUploader compact resetAfterDone onDone={xemGoiY} />

        <QuickPantry />

        {/* Màn nhỏ gấp lại cho gọn; màn rộng mở sẵn vì gấp cả hai mục lại để
            trống nửa trang dưới. Thứ tự và độ đậm nhạt mới là cái giữ tiêu điểm
            cho mâm gợi ý, không phải việc ẩn mấy mục này đi. */}
        {!laBuaSang && !showMore && (
          <Button
            variant="ghost"
            className="min-h-11 w-full md:hidden"
            onClick={() => setShowMore(true)}
          >
            Xem thêm mâm khác và món lẻ
          </Button>
        )}

        <div
          className={cn(
            "space-y-6",
            (laBuaSang || !showMore) && "hidden",
            !laBuaSang && "md:block",
          )}
        >
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
