"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatPanel } from "@/components/chat-panel";
import { duongDanMon } from "@/lib/dish-link";
import { useCatalog } from "@/lib/catalog-context";
import { usePantry } from "@/lib/pantry-store";
import { MEAL_THREAD, useChatStore } from "@/lib/chat-store";
import type { ChatResponse, PrefsProposal } from "@/lib/chat-api";

const SUGGESTIONS = [
  "Nhà em không ăn được hải sản",
  "Thứ 2 nhà em ăn chay",
  "Nhà có bé 2 tuổi, nấu nhạt thôi",
  "Buổi tối muốn ăn nhẹ",
];

export default function TroLyPage() {
  const { dishes, ingredientName } = useCatalog();
  const { items } = usePantry();
  const { prefs, mergePrefs, removeAvoid, removeNote, hydrated } =
    useChatStore();

  const [proposal, setProposal] = React.useState<PrefsProposal | null>(null);
  const [picked, setPicked] = React.useState<string[]>([]);
  const [dropped, setDropped] = React.useState<string[]>([]);

  // Gọi lúc gửi nên luôn lấy được tủ lạnh và ràng buộc ở trạng thái mới nhất
  const context = () => ({ pantry: items, prefs });

  const onResponse = (response: ChatResponse) => {
    setProposal(response.prefsProposal ?? null);
    setPicked(response.pickedDishIds ?? []);
    setDropped(response.dropped ?? []);
  };

  const pickedDishes = React.useMemo(
    () =>
      picked
        .map((id) => dishes.find((dish) => dish.id === id))
        .filter((dish) => dish !== undefined),
    [picked, dishes],
  );

  return (
    <div className="flex h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom))] flex-col">
      <PageHeader
        title="Trợ lý bếp"
        subtitle="Nói thói quen ăn uống của nhà, mình gợi ý sát hơn"
        action={<ThemeToggle />}
      />

      {hydrated && (prefs.avoid.length > 0 || prefs.notes.length > 0) && (
        <div className="space-y-2 border-b px-4 py-3">
          <p className="text-muted-foreground text-xs font-medium">
            Mình đang nhớ những điều này
          </p>
          <div className="flex flex-wrap gap-1.5">
            {prefs.avoid.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => removeAvoid(id)}
                className="bg-destructive/10 text-destructive flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium active:scale-95"
              >
                Tránh {ingredientName(id)}
                <X className="size-3" />
              </button>
            ))}
            {prefs.notes.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => removeNote(note)}
                className="bg-secondary text-secondary-foreground flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium active:scale-95"
              >
                {note}
                <X className="size-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-3">
        <ChatPanel
          threadKey={MEAL_THREAD}
          scope="meal"
          context={context}
          placeholder="Ví dụ: nhà em không ăn được tôm cua"
          emptyTitle="Nhà mình ăn uống thế nào?"
          emptyHint="Kiêng gì, mấy người ăn, có trẻ nhỏ không — mình nhớ để gợi ý sát hơn."
          suggestions={SUGGESTIONS}
          onResponse={onResponse}
          footer={
            <>
              {proposal && (
                <div className="border-primary/40 bg-primary/5 space-y-3 rounded-2xl border p-3">
                  <p className="text-sm font-semibold">Ghi nhớ điều này nhé?</p>

                  {dropped.length > 0 && (
                    <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        Đã bỏ qua {dropped.length} mục không có trong danh mục.
                      </span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {proposal.avoid.map((id) => (
                      <span
                        key={id}
                        className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-[11px]"
                      >
                        Tránh {ingredientName(id)}
                      </span>
                    ))}
                    {proposal.notes.map((note) => (
                      <span
                        key={note}
                        className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-[11px]"
                      >
                        {note}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        mergePrefs(proposal);
                        setProposal(null);
                      }}
                    >
                      <Check /> Lưu lại
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setProposal(null)}
                    >
                      <X /> Thôi
                    </Button>
                  </div>
                </div>
              )}

              {pickedDishes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium">
                    Món hợp với nhà mình
                  </p>
                  <div className="grid gap-2">
                    {pickedDishes.map((dish) => (
                      <Link
                        key={dish.id}
                        href={duongDanMon(dish)}
                        prefetch
                        className="hover:bg-muted/60 flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 transition-colors active:scale-[0.99]"
                      >
                        <span className="bg-accent flex size-10 shrink-0 items-center justify-center rounded-xl text-xl">
                          {dish.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {dish.name}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {dish.minutes} phút
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          }
        />
      </div>
    </div>
  );
}
