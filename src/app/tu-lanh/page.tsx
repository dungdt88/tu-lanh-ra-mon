"use client";

import * as React from "react";
import Link from "next/link";
import { ChefHat, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  INGREDIENTS,
} from "@/data/ingredients";
import { usePantry } from "@/lib/pantry-store";
import { cn } from "@/lib/utils";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

export default function PantryPage() {
  const { items, has, toggle, clear, hydrated } = usePantry();
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = normalize(query.trim());
    return INGREDIENTS.filter((i) => !q || normalize(i.name).includes(q));
  }, [query]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tủ lạnh của tôi"
        subtitle={
          hydrated ? `${items.length} nguyên liệu đang có` : "Đang tải…"
        }
        backHref="/"
        action={
          items.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 /> Xoá hết
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4 px-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nguyên liệu…"
            className="pl-9"
          />
        </div>

        {CATEGORY_ORDER.map((category) => {
          const list = filtered.filter((i) => i.category === category);
          if (list.length === 0) return null;

          return (
            <section key={category} className="space-y-2">
              <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {CATEGORY_LABEL[category]}
                {category === "gia-vi" && " (mặc định luôn có)"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {list.map((ingredient) => {
                  const active = hydrated && has(ingredient.id);
                  return (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => toggle(ingredient.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
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
        })}
      </div>

      <div className="bg-background/95 fixed inset-x-0 bottom-[68px] z-30 mx-auto w-full max-w-lg border-t p-3 backdrop-blur">
        <Button
          asChild
          size="lg"
          className="w-full"
          disabled={items.length === 0}
        >
          <Link href="/goi-y">
            <ChefHat /> Gợi ý món với {items.length} nguyên liệu
          </Link>
        </Button>
      </div>
      <div className="h-16" />
    </div>
  );
}
