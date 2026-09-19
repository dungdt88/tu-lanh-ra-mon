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
import { DB_SCHEMA } from "@/lib/supabase/env";

// DB có khoá ngoại dish_ingredients -> ingredients, còn src/data thì không: một id
// gõ sai chỉ làm món "thiếu nguyên liệu" một cách im lặng khi chạy mock, rồi mới nổ
// lúc đổ seed. Chặn ngay ở đây để lỗi hiện ra trên máy chứ không hiện trong SQL Editor.
function assertDataIsSound() {
  const errors: string[] = [];
  const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  for (const i of INGREDIENTS) {
    if (!kebab.test(i.id))
      errors.push(`nguyên liệu có id sai định dạng: "${i.id}"`);
  }
  for (const d of DISHES) {
    if (!kebab.test(d.id)) errors.push(`món có id sai định dạng: "${d.id}"`);
  }

  const known = new Set(INGREDIENTS.map((i) => i.id));
  for (const dish of DISHES) {
    for (const [field, ids] of [
      ["core", dish.core],
      ["optional", dish.optional],
    ] as const) {
      for (const id of ids) {
        if (!known.has(id)) {
          errors.push(
            `${dish.id}.${field} trỏ tới nguyên liệu không có: "${id}"`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(
      `Dữ liệu trong src/data chưa hợp lệ (${errors.length} lỗi):\n`,
    );
    for (const e of errors) console.error(`  - ${e}`);
    console.error("\nSửa src/data rồi chạy lại. Chưa ghi seed.sql.");
    process.exit(1);
  }
}

assertDataIsSound();

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;
const arr = (values: string[]) =>
  values.length === 0 ? "'{}'" : `array[${values.map(q).join(", ")}]`;
const enumArr = (values: string[], type: string) =>
  values.length === 0
    ? `'{}'::${type}[]`
    : `array[${values.map(q).join(", ")}]::${type}[]`;

const lines: string[] = [
  "-- File này được sinh tự động bởi scripts/generate-seed.ts - đừng sửa tay.",
  "-- Chạy lại: npm run seed:gen",
  "",
  "begin;",
  "",
  "-- Xoá dữ liệu danh mục cũ (không đụng tới bảng của người dùng)",
  `delete from ${DB_SCHEMA}.dish_ingredients;`,
  `delete from ${DB_SCHEMA}.dishes;`,
  `delete from ${DB_SCHEMA}.ingredients;`,
  "",
];

lines.push(
  `insert into ${DB_SCHEMA}.ingredients (id, name, emoji, category, staple, aliases) values`,
);
lines.push(
  INGREDIENTS.map(
    (i) =>
      `  (${q(i.id)}, ${q(i.name)}, ${q(i.emoji)}, ${q(i.category)}, ${i.staple ? "true" : "false"}, ${arr(i.aliases ?? [])})`,
  ).join(",\n") + ";",
);
lines.push("");

lines.push(
  `insert into ${DB_SCHEMA}.dishes (id, slug, name, emoji, summary, role, slots, minutes, servings, difficulty, tags, kcal, protein, carb, fat, steps, tip) values`,
);
lines.push(
  DISHES.map(
    (d) =>
      `  (${q(d.id)}, ${q(d.slug)}, ${q(d.name)}, ${q(d.emoji)}, ${q(d.summary)}, ${q(d.role)}, ${enumArr(d.slots, `${DB_SCHEMA}.meal_slot`)}, ${d.minutes}, ${d.servings}, ${d.difficulty}, ${arr(d.tags)}, ${d.nutrition.kcal}, ${d.nutrition.protein}, ${d.nutrition.carb}, ${d.nutrition.fat}, ${arr(d.steps)}, ${d.tip ? q(d.tip) : "null"})`,
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
  `insert into ${DB_SCHEMA}.dish_ingredients (dish_id, ingredient_id, required, position) values`,
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
