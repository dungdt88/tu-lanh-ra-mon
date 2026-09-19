import type { Dish, DishOverride } from "@/lib/types";

/**
 * Đắp bản chỉnh của người dùng lên món gốc.
 * Trường nào override không có thì giữ nguyên của món gốc.
 */
export function applyOverride(dish: Dish, override?: DishOverride): Dish {
  if (!override) return dish;
  return {
    ...dish,
    name: override.name ?? dish.name,
    summary: override.summary ?? dish.summary,
    minutes: override.minutes ?? dish.minutes,
    core: override.core ?? dish.core,
    optional: override.optional ?? dish.optional,
    steps: override.steps ?? dish.steps,
    tip: override.tip ?? dish.tip,
  };
}

export function applyOverrides(
  dishes: Dish[],
  overrides: Record<string, DishOverride>,
): Dish[] {
  if (Object.keys(overrides).length === 0) return dishes;
  return dishes.map((dish) => applyOverride(dish, overrides[dish.id]));
}

/**
 * Bỏ những món dùng nguyên liệu cả nhà cần tránh.
 * Chỉ xét `core`: nguyên liệu phụ thiếu thì vẫn nấu được nên không loại món.
 */
export function filterByAvoid(dishes: Dish[], avoid: string[]): Dish[] {
  if (avoid.length === 0) return dishes;
  const banned = new Set(avoid);
  return dishes.filter((dish) => !dish.core.some((id) => banned.has(id)));
}
