import "server-only";

import { cache } from "react";
import { DISHES } from "@/data/dishes";
import { INGREDIENTS } from "@/data/ingredients";
import { createClient } from "@/lib/supabase/server";
import type { Dish, Ingredient } from "@/lib/types";
import type {
  DishIngredientRow,
  DishRow,
  IngredientRow,
} from "@/lib/supabase/database.types";

export type Catalog = {
  ingredients: Ingredient[];
  dishes: Dish[];
  /** "mock" = đang đọc src/data vì chưa cấu hình Supabase */
  source: "supabase" | "mock";
};

const MOCK_CATALOG: Catalog = {
  ingredients: INGREDIENTS,
  dishes: DISHES,
  source: "mock",
};

function toIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    category: row.category,
    staple: row.staple,
    aliases: row.aliases ?? [],
  };
}

function toDish(row: DishRow, links: DishIngredientRow[]): Dish {
  const sorted = [...links].sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    emoji: row.emoji,
    summary: row.summary,
    role: row.role,
    slots: row.slots,
    minutes: row.minutes,
    servings: row.servings,
    difficulty: row.difficulty,
    tags: row.tags ?? [],
    core: sorted.filter((l) => l.required).map((l) => l.ingredient_id),
    optional: sorted.filter((l) => !l.required).map((l) => l.ingredient_id),
    nutrition: {
      kcal: row.kcal,
      protein: row.protein,
      carb: row.carb,
      fat: row.fat,
    },
    steps: row.steps ?? [],
    tip: row.tip ?? undefined,
  };
}

/**
 * Nguồn dữ liệu duy nhất cho danh mục món và nguyên liệu.
 * Có Supabase thì đọc DB, chưa có thì dùng dữ liệu mock trong src/data,
 * nên app luôn chạy được kể cả khi chưa cấu hình gì.
 *
 * Bọc `cache()` vì một request có thể hỏi danh mục nhiều lần (layout, feed,
 * trang chi tiết) - không có nó là bấy nhiêu lượt gọi Supabase.
 */
export const getCatalog = cache(async (): Promise<Catalog> => {
  const supabase = await createClient();
  if (!supabase) return MOCK_CATALOG;

  const [ingredientsResult, dishesResult, linksResult] = await Promise.all([
    supabase.from("ingredients").select("*").order("id"),
    supabase.from("dishes").select("*").order("id"),
    supabase.from("dish_ingredients").select("*"),
  ]);

  const failed =
    ingredientsResult.error || dishesResult.error || linksResult.error;

  if (failed || !ingredientsResult.data?.length || !dishesResult.data?.length) {
    if (failed) {
      console.error(
        "[catalog] không đọc được từ Supabase, tạm dùng dữ liệu mock:",
        failed.message,
      );
    }
    return MOCK_CATALOG;
  }

  const linksByDish = new Map<string, DishIngredientRow[]>();
  for (const link of linksResult.data ?? []) {
    const list = linksByDish.get(link.dish_id) ?? [];
    list.push(link);
    linksByDish.set(link.dish_id, list);
  }

  return {
    ingredients: ingredientsResult.data.map(toIngredient),
    dishes: dishesResult.data.map((row) =>
      toDish(row, linksByDish.get(row.id) ?? []),
    ),
    source: "supabase",
  };
});
