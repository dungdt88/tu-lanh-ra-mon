"use client";

import * as React from "react";
import { Check, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getIngredient, searchIngredients } from "@/data/ingredients";
import { usePantry } from "@/lib/pantry-store";
import { capitalize } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * Ô điền nguyên liệu: gõ tên bất kỳ (không cần dấu).
 * - Trùng danh mục -> thêm đúng nguyên liệu đó để engine gợi ý hiểu được.
 * - Không có trong danh mục -> lưu thành nguyên liệu tự thêm của người dùng.
 */
export function AddIngredient({
  autoFocus,
  onAdded,
  placeholder = "Gõ tên nguyên liệu…",
}: {
  autoFocus?: boolean;
  onAdded?: (id: string) => void;
  placeholder?: string;
}) {
  const { addByName, add, has, hydrated } = usePantry();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [justAdded, setJustAdded] = React.useState<string | null>(null);

  const suggestions = React.useMemo(() => searchIngredients(query), [query]);
  const trimmed = query.trim();
  const exactInList = suggestions.some(
    (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
  );

  function commit(id: string | null, label: string) {
    if (!id) return;
    // Gõ "thit heo" mà khớp danh mục thì báo đúng tên chuẩn
    setJustAdded(getIngredient(id)?.name ?? label);
    setQuery("");
    onAdded?.(id);
    window.setTimeout(() => setJustAdded(null), 1800);
  }

  return (
    <div className="space-y-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          // Chưa gõ gì thì đưa con trỏ vào ô nhập thay vì trơ ra
          if (!trimmed) {
            inputRef.current?.focus();
            return;
          }
          commit(addByName(trimmed), capitalize(trimmed));
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="pl-9"
            enterKeyHint="done"
          />
        </div>
        <Button type="submit">
          <Plus /> Thêm
        </Button>
      </form>

      {justAdded && (
        <p className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5" /> Đã thêm {justAdded} vào tủ lạnh
        </p>
      )}

      {trimmed.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((ingredient) => {
            const owned = hydrated && has(ingredient.id);
            return (
              <button
                key={ingredient.id}
                type="button"
                onClick={() => {
                  add(ingredient.id);
                  commit(ingredient.id, ingredient.name);
                }}
                className={cn(
                  "flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                  owned
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-background hover:bg-muted",
                )}
              >
                <span>{ingredient.emoji}</span>
                {ingredient.name}
                {owned && <Check className="size-3.5 text-emerald-600" />}
              </button>
            );
          })}

          {!exactInList && (
            <button
              type="button"
              onClick={() => commit(addByName(trimmed), capitalize(trimmed))}
              className="border-primary text-primary hover:bg-primary/10 flex min-h-10 items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm"
            >
              <Plus className="size-3.5" /> Thêm “{capitalize(trimmed)}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
