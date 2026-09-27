"use client";

import Link from "next/link";
import * as React from "react";
import {
  Check,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { ShareButton } from "@/components/share-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABEL } from "@/data/dishes";
import { xoaCongThuc, type ActionState } from "@/lib/actions/recipe";
import { useCatalog } from "@/lib/catalog-context";
import { usePantry } from "@/lib/pantry-store";
import type { Dish } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRONG: ActionState = {};

const DIFFICULTY_LABEL = ["Rất dễ", "Vừa tay", "Cần chút nghề"];

export type CongThucXem = Dish & {
  recipeId: string;
  extras: string[];
  isPublic: boolean;
};

function NutXoa({ id }: { id: string }) {
  const [state, formAction, pending] = React.useActionState(xoaCongThuc, TRONG);
  const [hoi, setHoi] = React.useState(false);

  if (!hoi) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive w-full"
        onClick={() => setHoi(true)}
      >
        <Trash2 className="size-4" /> Xoá công thức
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <p className="text-muted-foreground text-center text-sm">
        Xoá hẳn công thức này? Bài đã khoe vẫn còn.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setHoi(false)}
        >
          Thôi
        </Button>
        <Button
          type="submit"
          variant="destructive"
          className="flex-1"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />} Xoá
        </Button>
      </div>
      {state.error && (
        <p className="text-destructive text-center text-sm">{state.error}</p>
      )}
    </form>
  );
}

export function RecipeDetail({
  congThuc,
  cuaToi,
  tacGia,
}: {
  congThuc: CongThucXem;
  cuaToi: boolean;
  tacGia?: string;
}) {
  const { has, add, hydrated } = usePantry();
  const { getIngredient } = useCatalog();

  const rows = [
    ...congThuc.core.map((id) => ({ id, required: true })),
    ...congThuc.optional.map((id) => ({ id, required: false })),
  ];
  const thieu = congThuc.core.filter(
    (id) => hydrated && !has(id) && !getIngredient(id)?.staple,
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={congThuc.name}
        subtitle={cuaToi ? "Công thức nhà mình" : tacGia}
        backHref={cuaToi ? "/cong-thuc" : "/"}
        action={
          <div className="flex items-center gap-1">
            {congThuc.isPublic && (
              <ShareButton
                path={`/cong-thuc/${congThuc.recipeId}`}
                title={`${congThuc.name} · Tủ Lạnh Ra Món`}
                text={congThuc.summary}
                label=""
                variant="ghost"
              />
            )}
            <ThemeToggle />
          </div>
        }
      />

      <div className="space-y-5 px-4">
        <div className="flex items-start gap-3">
          <span className="bg-accent flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl">
            {congThuc.emoji}
          </span>
          <div className="min-w-0 flex-1">
            {congThuc.summary && (
              <p className="text-muted-foreground text-sm">
                {congThuc.summary}
              </p>
            )}
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {congThuc.minutes} phút
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" /> {congThuc.servings} người
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {ROLE_LABEL[congThuc.role]}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {DIFFICULTY_LABEL[congThuc.difficulty - 1]}
              </Badge>
              {cuaToi && !congThuc.isPublic && (
                <Badge variant="outline" className="text-[10px]">
                  Chỉ nhà mình thấy
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold">Nguyên liệu</p>
            <ul className="space-y-1.5">
              {rows.map(({ id, required }) => {
                const item = getIngredient(id);
                const co = hydrated && (has(id) || item?.staple);
                return (
                  <li key={id} className="flex items-center gap-2 text-sm">
                    <span>{item?.emoji ?? "🥘"}</span>
                    <span
                      className={cn(
                        "flex-1",
                        !required && "text-muted-foreground",
                      )}
                    >
                      {item?.name ?? id}
                      {!required && " (tuỳ chọn)"}
                    </span>
                    {co ? (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      hydrated && (
                        <button
                          type="button"
                          onClick={() => add(id)}
                          className="text-primary flex items-center gap-1 text-xs"
                        >
                          <Plus className="size-3.5" /> vào tủ
                        </button>
                      )
                    )}
                  </li>
                );
              })}

              {congThuc.extras.map((ten) => (
                <li key={ten} className="flex items-center gap-2 text-sm">
                  <span>🥘</span>
                  <span className="flex-1">{ten}</span>
                </li>
              ))}
            </ul>

            {thieu.length > 0 && (
              <>
                <Separator />
                <p className="text-muted-foreground text-xs">
                  Cần mua thêm:{" "}
                  <span className="text-foreground font-medium">
                    {thieu
                      .map((id) => getIngredient(id)?.name ?? id)
                      .join(", ")}
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {congThuc.steps.length > 0 && (
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold">Các bước</p>
              <ol className="space-y-2">
                {congThuc.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm">
                    <span className="bg-accent text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {congThuc.tip && (
          <p className="bg-accent/50 rounded-xl p-3 text-sm">
            💡 {congThuc.tip}
          </p>
        )}

        {cuaToi && (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/cong-dong/dang?mon=${congThuc.id}`}>
                Khoe món này lên cộng đồng
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/cong-thuc/${congThuc.recipeId}/sua`}>
                <Pencil className="size-4" /> Sửa công thức
              </Link>
            </Button>
            <NutXoa id={congThuc.recipeId} />
          </div>
        )}
      </div>
    </div>
  );
}
