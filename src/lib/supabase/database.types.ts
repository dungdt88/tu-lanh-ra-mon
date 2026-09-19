import type { Dish, Ingredient, MealSlot } from "@/lib/types";

/** Bảng tlrm.ingredients */
export type IngredientRow = {
  id: string;
  name: string;
  emoji: string;
  category: Ingredient["category"];
  staple: boolean;
  aliases: string[];
  created_at: string;
};

/** Bảng tlrm.dishes */
export type DishRow = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  summary: string;
  role: Dish["role"];
  slots: MealSlot[];
  minutes: number;
  servings: number;
  difficulty: 1 | 2 | 3;
  tags: string[];
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  steps: string[];
  tip: string | null;
  created_at: string;
  updated_at: string;
};

/** Bảng tlrm.dish_ingredients */
export type DishIngredientRow = {
  dish_id: string;
  ingredient_id: string;
  required: boolean;
  position: number;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  household_size: number;
  created_at: string;
};

export type PantryItemRow = {
  user_id: string;
  ingredient_id: string;
  custom_name: string | null;
  added_at: string;
};

export type CookLogRow = {
  id: string;
  user_id: string;
  dish_id: string | null;
  dish_name: string;
  slot: MealSlot;
  cooked_on: string;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type Database = {
  tlrm: {
    Tables: {
      ingredients: Table<IngredientRow>;
      dishes: Table<DishRow>;
      dish_ingredients: Table<DishIngredientRow>;
      profiles: Table<ProfileRow>;
      pantry_items: Table<PantryItemRow>;
      cook_logs: Table<CookLogRow>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      ingredient_category: Ingredient["category"];
      dish_role: Dish["role"];
      meal_slot: MealSlot;
    };
    CompositeTypes: Record<never, never>;
  };
};
