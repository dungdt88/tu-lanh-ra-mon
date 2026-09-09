/**
 * Sinh supabase/seed.sql từ dữ liệu mock trong src/data.
 * Chạy: npm run seed:gen
 *
 * Nhờ vậy danh mục món/nguyên liệu chỉ cần sửa ở một nơi (src/data),
 * DB luôn đổ lại được từ đúng nguồn đó.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { INGREDIENTS } from "@/data/ingredients";
import { DISHES } from "@/data/dishes";

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;
const arr = (values: string[]) =>
  values.length === 0 ? "'{}'" : `array[${values.map(q).join(", ")}]`;
const enumArr = (values: string[], type: string) =>
  values.length === 0 ? `'{}'::${type}[]` : `array[${values.map(q).join(", ")}]::${type}[]`;

const lines: string[] = [
  "-- File này được sinh tự động bởi scripts/generate-seed.ts - đừng sửa tay.",
  "-- Chạy lại: npm run seed:gen",
  "",
  "begin;",
  "",
  "-- Xoá dữ liệu danh mục cũ (không đụng tới bảng của người dùng)",
  "delete from public.dish_ingredients;",
  "delete from public.dishes;",
  "delete from public.ingredients;",
  "",
];

lines.push("insert into public.ingredients (id, name, emoji, category, staple, aliases) values");
lines.push(
  INGREDIENTS.map(
    (i) =>
      `  (${q(i.id)}, ${q(i.name)}, ${q(i.emoji)}, ${q(i.category)}, ${i.staple ? "true" : "false"}, ${arr(i.aliases ?? [])})`,
  ).join(",\n") + ";",
);
lines.push("");

lines.push(
  "insert into public.dishes (id, slug, name, emoji, summary, role, slots, minutes, servings, difficulty, tags, kcal, protein, carb, fat, steps, tip) values",
);
lines.push(
  DISHES.map(
    (d) =>
      `  (${q(d.id)}, ${q(d.slug)}, ${q(d.name)}, ${q(d.emoji)}, ${q(d.summary)}, ${q(d.role)}, ${enumArr(d.slots, "meal_slot")}, ${d.minutes}, ${d.servings}, ${d.difficulty}, ${arr(d.tags)}, ${d.nutrition.kcal}, ${d.nutrition.protein}, ${d.nutrition.carb}, ${d.nutrition.fat}, ${arr(d.steps)}, ${d.tip ? q(d.tip) : "null"})`,
  ).join(",\n") + ";",
);
lines.push("");

const links: string[] = [];
for (const dish of DISHES) {
  dish.core.forEach((ingredientId, index) =>
    links.push(`  (${q(dish.id)}, ${q(ingredientId)}, true, ${index})`),
  );
  dish.optional.forEach((ingredientId, index) =>
    links.push(`  (${q(dish.id)}, ${q(ingredientId)}, false, ${index})`),
  );
}
lines.push(
  "insert into public.dish_ingredients (dish_id, ingredient_id, required, position) values",
);
lines.push(links.join(",\n") + ";");
lines.push("");
lines.push("commit;");
lines.push("");

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/seed.sql", lines.join("\n"), "utf8");

console.log(
  `Đã ghi supabase/seed.sql: ${INGREDIENTS.length} nguyên liệu, ${DISHES.length} món, ${links.length} liên kết.`,
);
