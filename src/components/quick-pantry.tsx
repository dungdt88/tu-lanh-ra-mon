"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { INGREDIENTS } from "@/data/ingredients";
import { usePantry } from "@/lib/pantry-store";
import { cn } from "@/lib/utils";

/** Nguyên liệu hay có trong tủ nhất - chạm 1 phát là đổi gợi ý */
const QUICK_IDS = [
  "trung-ga",
  "thit-ba-chi",
  "thit-bam",
  "dui-ga",
  "tom",
  "ca-basa",
  "ca-chua",
  "rau-muong",
  "cai-thao",
  "bap-cai",
  "bi-xanh",
  "ca-rot",
  "dau-hu",
  "khoai-tay",
  "su-su",
  "nam-rom",
];

export function QuickPantry() {
  const { has, toggle, items, hydrated } = usePantry();

  // Nguyên liệu đã chọn luôn hiện trước, kể cả khi không nằm trong danh sách nhanh
  const ids = Array.from(new Set([...items, ...QUICK_IDS]));

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Tủ lạnh đang có {hydrated && items.length > 0 && `(${items.length})`}
        </h2>
        <Link
          href="/tu-lanh"
          className="text-muted-foreground hover:text-foreground flex items-center text-xs"
        >
          Tất cả nguyên liệu <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {ids.map((id) => {
          const ingredient = INGREDIENTS.find((i) => i.id === id);
          if (!ingredient) return null;
          const active = hydrated && has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted",
              )}
            >
              <span>{ingredient.emoji}</span>
              {ingredient.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
