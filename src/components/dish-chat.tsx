"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  MessageCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatPanel } from "@/components/chat-panel";
import { useCatalog } from "@/lib/catalog-context";
import { usePantry } from "@/lib/pantry-store";
import { dishThread, useChatStore } from "@/lib/chat-store";
import type { ChatResponse, DishProposal } from "@/lib/chat-api";
import type { Dish } from "@/lib/types";

const SUGGESTIONS = [
  "Làm ít dầu mỡ hơn",
  "Nhà có bé nhỏ, đừng cay",
  "Nấu nhanh hơn được không",
  "Nhà không ăn được hải sản",
];

/** Danh sách nguyên liệu dạng chip, dùng cho cả cột cũ và cột mới */
function IngredientChips({
  ids,
  ingredientName,
  muted,
}: {
  ids: string[];
  ingredientName: (id: string) => string;
  muted?: boolean;
}) {
  if (ids.length === 0) {
    return <p className="text-muted-foreground text-xs">(không có)</p>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <span
          key={id}
          className={
            muted
              ? "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] line-through"
              : "bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-[11px]"
          }
        >
          {ingredientName(id)}
        </span>
      ))}
    </div>
  );
}

export function DishChat({ dish }: { dish: Dish }) {
  const [open, setOpen] = React.useState(false);
  const [proposal, setProposal] = React.useState<DishProposal | null>(null);
  const [dropped, setDropped] = React.useState<string[]>([]);

  const { ingredientName } = useCatalog();
  const { items } = usePantry();
  const { setOverride } = useChatStore();

  // Gọi lúc gửi nên luôn lấy được món và tủ lạnh ở trạng thái mới nhất
  const context = () => ({ dish, pantry: items });

  const onResponse = (response: ChatResponse) => {
    setProposal(response.dishProposal ?? null);
    setDropped(response.dropped ?? []);
  };

  const apply = () => {
    if (!proposal) return;
    setOverride({
      dishId: dish.id,
      name: proposal.name,
      summary: proposal.summary,
      minutes: proposal.minutes,
      core: proposal.core,
      optional: proposal.optional,
      steps: proposal.steps,
      tip: proposal.tip,
      note: proposal.note,
      updatedAt: new Date().toISOString(),
    });
    setProposal(null);
  };

  const coreChanged =
    proposal?.core && proposal.core.join() !== dish.core.join();
  const optionalChanged =
    proposal?.optional && proposal.optional.join() !== dish.optional.join();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="min-h-11 w-full">
          <MessageCircle /> Chỉnh món theo ý nhà mình
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="flex h-[85dvh] flex-col gap-0 p-4 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 p-0 pb-2">
          <SheetTitle className="text-base">{dish.name}</SheetTitle>
          <SheetDescription className="text-xs">
            Nói bạn muốn đổi gì. Mình đề xuất, bạn xem rồi mới áp dụng.
          </SheetDescription>
        </SheetHeader>

        <ChatPanel
          threadKey={dishThread(dish.id)}
          scope="dish"
          context={context}
          placeholder="Ví dụ: bỏ tôm, thay bằng thịt băm"
          emptyTitle="Chỉnh món này theo ý nhà mình"
          emptyHint="Bỏ nguyên liệu không ăn được, làm nhạt hơn, nấu nhanh hơn…"
          suggestions={SUGGESTIONS}
          onResponse={onResponse}
          footer={
            proposal && (
              <div className="border-primary/40 bg-primary/5 space-y-3 rounded-2xl border p-3">
                <p className="text-sm font-semibold">{proposal.note}</p>

                {dropped.length > 0 && (
                  <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Đã bỏ qua {dropped.length} nguyên liệu không có trong danh
                      mục.
                    </span>
                  </p>
                )}

                {coreChanged && (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-medium">
                      Nguyên liệu chính
                    </p>
                    <IngredientChips
                      ids={dish.core}
                      ingredientName={ingredientName}
                      muted
                    />
                    <ArrowRight className="text-muted-foreground size-3.5" />
                    <IngredientChips
                      ids={proposal.core ?? []}
                      ingredientName={ingredientName}
                    />
                  </div>
                )}

                {optionalChanged && (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-medium">
                      Nguyên liệu phụ
                    </p>
                    <IngredientChips
                      ids={proposal.optional ?? []}
                      ingredientName={ingredientName}
                    />
                  </div>
                )}

                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {proposal.minutes && proposal.minutes !== dish.minutes && (
                    <span>
                      Thời gian: {dish.minutes} → {proposal.minutes} phút
                    </span>
                  )}
                  {proposal.steps && (
                    <span>
                      Các bước: {dish.steps.length} → {proposal.steps.length}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={apply}>
                    <Check /> Áp dụng
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setProposal(null)}
                  >
                    <X /> Bỏ qua
                  </Button>
                </div>
              </div>
            )
          }
        />
      </SheetContent>
    </Sheet>
  );
}
