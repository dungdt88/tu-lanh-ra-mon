"use client";

import Link from "next/link";
import { UtensilsCrossed, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AddIngredient } from "@/components/add-ingredient";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  INGREDIENTS,
} from "@/data/ingredients";
import { usePantry } from "@/lib/pantry-store";
import { cn } from "@/lib/utils";

export default function PantryPage() {
  const { items, customs, has, toggle, clear, removeCustom, hydrated } =
    usePantry();

  const ownedCustoms = customs.filter((c) => items.includes(c.id));

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

      <div className="space-y-5 px-4">
        <AddIngredient />

        {ownedCustoms.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Bạn tự thêm
            </h2>
            <div className="flex flex-wrap gap-2">
              {ownedCustoms.map((ingredient) => (
                <span
                  key={ingredient.id}
                  className="border-primary bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full border py-1.5 pr-2 pl-3 text-sm"
                >
                  {ingredient.emoji} {ingredient.name}
                  <button
                    type="button"
                    aria-label={`Xoá ${ingredient.name}`}
                    onClick={() => removeCustom(ingredient.id)}
                    className="hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}

        {CATEGORY_ORDER.map((category) => {
          const list = INGREDIENTS.filter((i) => i.category === category);
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
          <Link href="/">
            <UtensilsCrossed /> Xem mâm cơm với {items.length} nguyên liệu
          </Link>
        </Button>
      </div>
      <div className="h-16" />
    </div>
  );
}
