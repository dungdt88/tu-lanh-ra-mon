export type IngredientCategory =
  | "thit"
  | "hai-san"
  | "rau"
  | "cu-qua"
  | "trung-sua"
  | "kho"
  | "gia-vi"
  | "khac";

export type Ingredient = {
  id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
  /** Coi như luôn có sẵn trong bếp, không tính vào danh sách đi chợ */
  staple?: boolean;
  /** Tên gọi khác để tìm kiếm: "thịt heo", "đậu phụ"... */
  aliases?: string[];
  /** Người dùng tự thêm, không nằm trong danh mục gốc */
  custom?: boolean;
};

export type MealSlot = "trua" | "toi";

/** Vai trò của món trong mâm cơm Việt */
export type DishRole = "man" | "canh" | "rau" | "com";

export type Nutrition = {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
};

export type Dish = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  summary: string;
  role: DishRole;
  slots: MealSlot[];
  minutes: number;
  servings: number;
  /** 1 = rất dễ, 3 = cần tay nghề */
  difficulty: 1 | 2 | 3;
  tags: string[];
  /** Nguyên liệu chính - thiếu thì phải đi chợ */
  core: string[];
  /** Có thì ngon hơn, không có vẫn nấu được */
  optional: string[];
  nutrition: Nutrition;
  steps: string[];
  tip?: string;
};

export type DishMatch = {
  dish: Dish;
  /** 0..1 - tỉ lệ nguyên liệu chính đang có */
  coverage: number;
  score: number;
  have: string[];
  missing: string[];
  bonus: string[];
};

export type MealPlan = {
  id: string;
  slot: MealSlot;
  dishes: DishMatch[];
  minutes: number;
  nutrition: Nutrition;
  missing: string[];
};
