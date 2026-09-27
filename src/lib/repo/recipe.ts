import "server-only";

import { cache } from "react";
import { CONG_THUC_PREFIX } from "@/lib/dish-link";
import { createClient } from "@/lib/supabase/server";
import type { RecipeRow } from "@/lib/supabase/database.types";
import type { Dish } from "@/lib/types";

/**
 * Công thức nhà mình, mang hình dạng `Dish` để dùng lại được toàn bộ máy gợi ý
 * và các thẻ món có sẵn. Phần thừa ra là những thứ món danh mục không có.
 */
export type CongThuc = Dish & {
  recipeId: string;
  authorId: string;
  extras: string[];
  isPublic: boolean;
  updatedAt: string;
};

export function toCongThuc(row: RecipeRow): CongThuc {
  return {
    id: `${CONG_THUC_PREFIX}${row.id}`,
    slug: `${CONG_THUC_PREFIX}${row.id}`,
    name: row.name,
    emoji: row.emoji,
    summary: row.summary,
    role: row.role,
    slots: row.slots,
    minutes: row.minutes,
    servings: row.servings,
    difficulty: row.difficulty,
    tags: [],
    core: row.core,
    optional: row.optional,
    nutrition: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    steps: row.steps,
    tip: row.tip ?? undefined,
    recipeId: row.id,
    authorId: row.author_id,
    extras: row.extras,
    isPublic: row.is_public,
    updatedAt: row.updated_at,
  };
}

/**
 * Công thức của người đang đăng nhập. Khách chưa đăng nhập thì rỗng - RLS đã
 * chặn sẵn, hỏi thêm chỉ tốn một lượt gọi.
 *
 * Bọc `cache()` vì layout và trang con cùng hỏi trong một request.
 */
export const getCongThucCuaToi = cache(async (): Promise<CongThuc[]> => {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("author_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[recipe] không đọc được công thức:", error.message);
    return [];
  }

  return (data ?? []).map(toCongThuc);
});

/**
 * Một công thức theo id. RLS lo phần quyền: chủ công thức luôn đọc được, người
 * khác chỉ đọc được khi công thức để công khai.
 */
export async function getCongThuc(id: string): Promise<CongThuc | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? toCongThuc(data) : null;
}
