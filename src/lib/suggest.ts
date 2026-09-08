import { DISHES } from "@/data/dishes";
import { INGREDIENT_MAP } from "@/data/ingredients";
import type {
  Dish,
  DishMatch,
  MealPlan,
  MealSlot,
  Nutrition,
} from "@/lib/types";

function isStaple(id: string): boolean {
  return INGREDIENT_MAP.get(id)?.staple === true;
}

/** Gia vị cơ bản coi như trong bếp lúc nào cũng có */
function available(id: string, pantry: Set<string>): boolean {
  return pantry.has(id) || isStaple(id);
}

export function matchDish(dish: Dish, pantry: Set<string>): DishMatch {
  const have = dish.core.filter((id) => available(id, pantry));
  const missing = dish.core.filter((id) => !available(id, pantry));
  const bonus = dish.optional.filter((id) => pantry.has(id));
  const coverage = dish.core.length === 0 ? 1 : have.length / dish.core.length;

  // Ưu tiên: nấu được ngay > ít thiếu > nhanh > dễ
  const score =
    coverage * 100 +
    (missing.length === 0 ? 25 : 0) +
    bonus.length * 4 -
    missing.length * 18 -
    dish.minutes * 0.4 -
    (dish.difficulty - 1) * 5;

  return { dish, coverage, score, have, missing, bonus };
}

export type RankOptions = {
  slot?: MealSlot;
  role?: Dish["role"];
  maxMinutes?: number;
  /** Chỉ lấy món nấu được ngay, không thiếu nguyên liệu chính */
  onlyCookable?: boolean;
  /** Cho phép thiếu tối đa bao nhiêu nguyên liệu chính */
  maxMissing?: number;
};

export function rankDishes(
  pantry: Set<string>,
  options: RankOptions = {},
): DishMatch[] {
  const { slot, role, maxMinutes, onlyCookable, maxMissing } = options;

  return DISHES.filter((d) => (slot ? d.slots.includes(slot) : true))
    .filter((d) => (role ? d.role === role : true))
    .filter((d) => (maxMinutes ? d.minutes <= maxMinutes : true))
    .map((d) => matchDish(d, pantry))
    .filter((m) => (onlyCookable ? m.missing.length === 0 : true))
    .filter((m) =>
      maxMissing === undefined ? true : m.missing.length <= maxMissing,
    )
    .sort((a, b) => b.score - a.score);
}

function sumNutrition(matches: DishMatch[]): Nutrition {
  return matches.reduce<Nutrition>(
    (acc, m) => ({
      kcal: acc.kcal + m.dish.nutrition.kcal,
      protein: acc.protein + m.dish.nutrition.protein,
      carb: acc.carb + m.dish.nutrition.carb,
      fat: acc.fat + m.dish.nutrition.fat,
    }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 },
  );
}

/** Nấu song song nên tổng thời gian ≈ món lâu nhất + một nửa các món còn lại */
function planMinutes(matches: DishMatch[]): number {
  if (matches.length === 0) return 0;
  const times = matches.map((m) => m.dish.minutes).sort((a, b) => b - a);
  const [longest, ...rest] = times;
  return Math.round(longest + rest.reduce((s, t) => s + t, 0) * 0.5);
}

export type PlanOptions = {
  slot: MealSlot;
  /** Trần thời gian cho cả mâm cơm */
  maxMinutes?: number;
  count?: number;
};

/**
 * Dựng mâm cơm: 1 món mặn + 1 canh + 1 rau.
 * Trả về nhiều phương án khác nhau để mẹ đổi món.
 */
export function buildMealPlans(
  pantry: Set<string>,
  { slot, maxMinutes, count = 3 }: PlanOptions,
): MealPlan[] {
  // Không lọc theo số nguyên liệu thiếu: điểm số đã ưu tiên món nấu được ngay,
  // nhờ vậy luôn đủ món để dựng nhiều mâm khác nhau.
  const byRole = {
    man: rankDishes(pantry, { slot, role: "man" }),
    canh: rankDishes(pantry, { slot, role: "canh" }),
    rau: rankDishes(pantry, { slot, role: "rau" }),
  };

  const plans: MealPlan[] = [];
  const used = new Set<string>();

  for (let i = 0; plans.length < count; i++) {
    const picked = (["man", "canh", "rau"] as const)
      .map((role) => byRole[role].find((m) => !used.has(m.dish.id)))
      .filter((m): m is DishMatch => Boolean(m));

    // Hết món chưa dùng cho một vai trò nào đó -> dừng, tránh lặp mâm
    if (picked.length < 3) break;

    const minutes = planMinutes(picked);
    picked.forEach((m) => used.add(m.dish.id));

    // Mâm đầu tiên luôn giữ lại để người dùng có gợi ý, các mâm sau mới lọc thời gian
    if (maxMinutes && minutes > maxMinutes && plans.length > 0) continue;

    plans.push({
      id: `${slot}-${picked.map((m) => m.dish.id).join("+")}`,
      slot,
      dishes: picked,
      minutes,
      nutrition: sumNutrition(picked),
      missing: Array.from(new Set(picked.flatMap((m) => m.missing))),
    });
  }

  return plans;
}

/** Gộp danh sách nguyên liệu còn thiếu của nhiều mâm cơm */
export function shoppingList(plans: MealPlan[]): string[] {
  return Array.from(new Set(plans.flatMap((p) => p.missing)));
}
