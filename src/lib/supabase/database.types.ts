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
  handle: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

/**
 * View tlrm.public_profiles - phần hồ sơ khách cũng xem được.
 * Cố tình không có household_size.
 */
export type PublicProfile = {
  id: string;
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
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

/** Bảng tlrm.posts - một lần khoe món */
export type PostRow = {
  id: string;
  author_id: string;
  dish_id: string | null;
  dish_name: string;
  caption: string;
  /** Đường dẫn trong bucket anh-mon, dạng <user_id>/<uuid>.jpg */
  image_path: string | null;
  minutes: number | null;
  ingredient_ids: string[];
  /** Công thức nhà mình đã nấu, nếu bài được đăng từ đó */
  recipe_id: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

export type PostLikeRow = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type PostCommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

type View<Row> = {
  Row: Row;
  Relationships: [];
};

/** Bảng tlrm.recipes - công thức người dùng tự viết */
export type RecipeRow = {
  id: string;
  author_id: string;
  name: string;
  emoji: string;
  summary: string;
  role: Dish["role"];
  slots: MealSlot[];
  minutes: number;
  servings: number;
  difficulty: 1 | 2 | 3;
  core: string[];
  optional: string[];
  /** Nguyên liệu ngoài danh mục, giữ nguyên tên người viết gõ */
  extras: string[];
  steps: string[];
  tip: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
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
      posts: Table<PostRow>;
      post_likes: Table<PostLikeRow>;
      post_comments: Table<PostCommentRow>;
      follows: Table<FollowRow>;
      recipes: Table<RecipeRow>;
    };
    Views: {
      public_profiles: View<PublicProfile>;
    };
    Functions: Record<never, never>;
    Enums: {
      ingredient_category: Ingredient["category"];
      dish_role: Dish["role"];
      meal_slot: MealSlot;
    };
    CompositeTypes: Record<never, never>;
  };
};
