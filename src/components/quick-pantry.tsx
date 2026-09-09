"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddIngredient } from "@/components/add-ingredient";
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
  const { has, toggle, resolve, items, hydrated } = usePantry();
  const [open, setOpen] = React.useState(false);

  // Nguyên liệu đã chọn (kể cả tự thêm) luôn hiện trước
  const ids = Array.from(new Set([...items, ...QUICK_IDS]));

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Tủ lạnh đang có {hydrated && items.length > 0 && `(${items.length})`}
        </h2>
        <Link
          href="/tu-lanh"
          prefetch
          className="text-muted-foreground hover:text-foreground flex items-center text-xs"
        >
          Tất cả nguyên liệu <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="border-primary text-primary hover:bg-primary/10 flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm active:scale-95">
            <Plus className="size-4" /> Điền nguyên liệu
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Điền nguyên liệu</DialogTitle>
              <DialogDescription>
                Gõ tên bất kỳ, không cần dấu. Thứ không có trong danh mục sẽ
                được lưu riêng cho bạn.
              </DialogDescription>
            </DialogHeader>
            <AddIngredient autoFocus />
          </DialogContent>
        </Dialog>

        {ids.map((id) => {
          const ingredient = resolve(id);
          if (!ingredient) return null;
          const active = hydrated && has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors active:scale-95",
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
