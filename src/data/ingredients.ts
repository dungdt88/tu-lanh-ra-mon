import type { Ingredient } from "@/lib/types";

export const INGREDIENTS: Ingredient[] = [
  // Thịt
  { id: "thit-ba-chi", name: "Thịt ba chỉ", emoji: "🥓", category: "thit" },
  { id: "thit-nac-vai", name: "Thịt nạc vai", emoji: "🥩", category: "thit" },
  { id: "thit-bam", name: "Thịt băm", emoji: "🍖", category: "thit" },
  { id: "suon-non", name: "Sườn non", emoji: "🍖", category: "thit" },
  { id: "thit-bo", name: "Thịt bò", emoji: "🥩", category: "thit" },
  { id: "uc-ga", name: "Ức gà", emoji: "🍗", category: "thit" },
  { id: "dui-ga", name: "Đùi gà", emoji: "🍗", category: "thit" },

  // Hải sản
  { id: "tom", name: "Tôm", emoji: "🦐", category: "hai-san" },
  { id: "ca-basa", name: "Cá basa", emoji: "🐟", category: "hai-san" },
  { id: "ca-thu", name: "Cá thu", emoji: "🐟", category: "hai-san" },
  { id: "muc", name: "Mực", emoji: "🦑", category: "hai-san" },
  { id: "ngheu", name: "Nghêu", emoji: "🐚", category: "hai-san" },

  // Rau
  { id: "rau-muong", name: "Rau muống", emoji: "🥬", category: "rau" },
  { id: "cai-ngot", name: "Cải ngọt", emoji: "🥬", category: "rau" },
  { id: "cai-thao", name: "Cải thảo", emoji: "🥬", category: "rau" },
  { id: "bap-cai", name: "Bắp cải", emoji: "🥬", category: "rau" },
  { id: "mong-toi", name: "Mồng tơi", emoji: "🌿", category: "rau" },
  { id: "rau-den", name: "Rau dền", emoji: "🌿", category: "rau" },
  { id: "gia-do", name: "Giá đỗ", emoji: "🌱", category: "rau" },
  { id: "nam-rom", name: "Nấm rơm", emoji: "🍄", category: "rau" },
  {
    id: "hanh-la",
    name: "Hành lá",
    emoji: "🌿",
    category: "rau",
    staple: true,
  },
  {
    id: "rau-thom",
    name: "Rau thơm",
    emoji: "🌿",
    category: "rau",
    staple: true,
  },

  // Củ quả
  { id: "ca-chua", name: "Cà chua", emoji: "🍅", category: "cu-qua" },
  { id: "dua-chuot", name: "Dưa chuột", emoji: "🥒", category: "cu-qua" },
  { id: "bi-xanh", name: "Bí xanh", emoji: "🥒", category: "cu-qua" },
  { id: "bi-do", name: "Bí đỏ", emoji: "🎃", category: "cu-qua" },
  { id: "ca-rot", name: "Cà rốt", emoji: "🥕", category: "cu-qua" },
  { id: "khoai-tay", name: "Khoai tây", emoji: "🥔", category: "cu-qua" },
  { id: "su-su", name: "Su su", emoji: "🥒", category: "cu-qua" },
  { id: "dau-que", name: "Đậu que", emoji: "🫛", category: "cu-qua" },
  { id: "hanh-tay", name: "Hành tây", emoji: "🧅", category: "cu-qua" },
  { id: "khom", name: "Thơm (dứa)", emoji: "🍍", category: "cu-qua" },
  { id: "me", name: "Me", emoji: "🫘", category: "cu-qua" },
  { id: "chanh", name: "Chanh", emoji: "🍋", category: "cu-qua", staple: true },
  { id: "toi", name: "Tỏi", emoji: "🧄", category: "cu-qua", staple: true },
  {
    id: "hanh-tim",
    name: "Hành tím",
    emoji: "🧅",
    category: "cu-qua",
    staple: true,
  },
  { id: "ot", name: "Ớt", emoji: "🌶️", category: "cu-qua", staple: true },
  { id: "gung", name: "Gừng", emoji: "🫚", category: "cu-qua", staple: true },

  // Trứng - sữa - đậu
  { id: "trung-ga", name: "Trứng gà", emoji: "🥚", category: "trung-sua" },
  { id: "dau-hu", name: "Đậu hũ", emoji: "🧈", category: "trung-sua" },
  { id: "sua-tuoi", name: "Sữa tươi", emoji: "🥛", category: "trung-sua" },

  // Đồ khô
  { id: "gao", name: "Gạo", emoji: "🍚", category: "kho", staple: true },
  { id: "bun", name: "Bún", emoji: "🍜", category: "kho" },
  { id: "mien", name: "Miến", emoji: "🍜", category: "kho" },
  { id: "banh-pho", name: "Bánh phở", emoji: "🍜", category: "kho" },
  { id: "lac", name: "Lạc (đậu phộng)", emoji: "🥜", category: "kho" },

  // Gia vị cơ bản
  {
    id: "nuoc-mam",
    name: "Nước mắm",
    emoji: "🧂",
    category: "gia-vi",
    staple: true,
  },
  {
    id: "dau-an",
    name: "Dầu ăn",
    emoji: "🫗",
    category: "gia-vi",
    staple: true,
  },
  { id: "muoi", name: "Muối", emoji: "🧂", category: "gia-vi", staple: true },
  { id: "duong", name: "Đường", emoji: "🍬", category: "gia-vi", staple: true },
  { id: "tieu", name: "Tiêu", emoji: "🧂", category: "gia-vi", staple: true },
  {
    id: "hat-nem",
    name: "Hạt nêm",
    emoji: "🧂",
    category: "gia-vi",
    staple: true,
  },
  {
    id: "nuoc-tuong",
    name: "Nước tương",
    emoji: "🍶",
    category: "gia-vi",
    staple: true,
  },
  {
    id: "dau-hao",
    name: "Dầu hào",
    emoji: "🍶",
    category: "gia-vi",
    staple: true,
  },
];

export const INGREDIENT_MAP = new Map(INGREDIENTS.map((i) => [i.id, i]));

export const CATEGORY_LABEL: Record<Ingredient["category"], string> = {
  thit: "Thịt",
  "hai-san": "Hải sản",
  rau: "Rau xanh",
  "cu-qua": "Củ & quả",
  "trung-sua": "Trứng, đậu, sữa",
  kho: "Đồ khô",
  "gia-vi": "Gia vị",
};

export const CATEGORY_ORDER: Ingredient["category"][] = [
  "thit",
  "hai-san",
  "rau",
  "cu-qua",
  "trung-sua",
  "kho",
  "gia-vi",
];

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENT_MAP.get(id);
}

export function ingredientName(id: string): string {
  return INGREDIENT_MAP.get(id)?.name ?? id;
}
