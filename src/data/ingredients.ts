import type { Ingredient } from "@/lib/types";
import { normalizeText } from "@/lib/text";

export const INGREDIENTS: Ingredient[] = [
  // Thịt
  {
    id: "thit-ba-chi",
    name: "Thịt ba chỉ",
    emoji: "🥓",
    category: "thit",
    aliases: ["thịt heo", "thịt lợn", "ba rọi"],
  },
  {
    id: "thit-nac-vai",
    name: "Thịt nạc vai",
    emoji: "🥩",
    category: "thit",
    aliases: ["nạc vai", "thịt nạc"],
  },
  {
    id: "thit-bam",
    name: "Thịt băm",
    emoji: "🍖",
    category: "thit",
    aliases: ["thịt xay", "thịt heo bằm"],
  },
  {
    id: "suon-non",
    name: "Sườn non",
    emoji: "🍖",
    category: "thit",
    aliases: ["sườn", "sườn heo"],
  },
  {
    id: "thit-bo",
    name: "Thịt bò",
    emoji: "🥩",
    category: "thit",
    aliases: ["bò", "bắp bò"],
  },
  {
    id: "uc-ga",
    name: "Ức gà",
    emoji: "🍗",
    category: "thit",
    aliases: ["gà", "thịt gà"],
  },
  {
    id: "dui-ga",
    name: "Đùi gà",
    emoji: "🍗",
    category: "thit",
    aliases: ["đùi gà", "cánh gà", "gà góc tư"],
  },

  // Hải sản
  {
    id: "tom",
    name: "Tôm",
    emoji: "🦐",
    category: "hai-san",
    aliases: ["tôm sú", "tôm thẻ"],
  },
  {
    id: "ca-basa",
    name: "Cá basa",
    emoji: "🐟",
    category: "hai-san",
    aliases: ["cá tra", "cá phi lê", "cá diêu hồng"],
  },
  {
    id: "ca-thu",
    name: "Cá thu",
    emoji: "🐟",
    category: "hai-san",
    aliases: ["cá ngừ"],
  },
  {
    id: "muc",
    name: "Mực",
    emoji: "🦑",
    category: "hai-san",
    aliases: ["mực ống", "mực lá"],
  },
  {
    id: "ngheu",
    name: "Nghêu",
    emoji: "🐚",
    category: "hai-san",
    aliases: ["ngao", "hến"],
  },

  // Rau
  {
    id: "rau-muong",
    name: "Rau muống",
    emoji: "🥬",
    category: "rau",
    aliases: ["muống"],
  },
  {
    id: "cai-ngot",
    name: "Cải ngọt",
    emoji: "🥬",
    category: "rau",
    aliases: ["cải xanh", "cải bẹ"],
  },
  {
    id: "cai-thao",
    name: "Cải thảo",
    emoji: "🥬",
    category: "rau",
    aliases: ["cải bắc thảo"],
  },
  {
    id: "bap-cai",
    name: "Bắp cải",
    emoji: "🥬",
    category: "rau",
    aliases: ["cải bắp"],
  },
  {
    id: "mong-toi",
    name: "Mồng tơi",
    emoji: "🌿",
    category: "rau",
    aliases: ["rau mồng tơi"],
  },
  {
    id: "rau-den",
    name: "Rau dền",
    emoji: "🌿",
    category: "rau",
    aliases: ["dền"],
  },
  {
    id: "gia-do",
    name: "Giá đỗ",
    emoji: "🌱",
    category: "rau",
    aliases: ["giá"],
  },
  {
    id: "nam-rom",
    name: "Nấm rơm",
    emoji: "🍄",
    category: "rau",
    aliases: ["nấm", "nấm bào ngư", "nấm kim châm"],
  },
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
  {
    id: "ca-chua",
    name: "Cà chua",
    emoji: "🍅",
    category: "cu-qua",
    aliases: ["cà chua bi"],
  },
  {
    id: "dua-chuot",
    name: "Dưa chuột",
    emoji: "🥒",
    category: "cu-qua",
    aliases: ["dưa leo"],
  },
  {
    id: "bi-xanh",
    name: "Bí xanh",
    emoji: "🥒",
    category: "cu-qua",
    aliases: ["bí đao"],
  },
  {
    id: "bi-do",
    name: "Bí đỏ",
    emoji: "🎃",
    category: "cu-qua",
    aliases: ["bí ngô"],
  },
  { id: "ca-rot", name: "Cà rốt", emoji: "🥕", category: "cu-qua" },
  {
    id: "khoai-tay",
    name: "Khoai tây",
    emoji: "🥔",
    category: "cu-qua",
    aliases: ["củ khoai tây"],
  },
  { id: "su-su", name: "Su su", emoji: "🥒", category: "cu-qua" },
  {
    id: "dau-que",
    name: "Đậu que",
    emoji: "🫛",
    category: "cu-qua",
    aliases: ["đậu cove", "đậu đũa"],
  },
  {
    id: "hanh-tay",
    name: "Hành tây",
    emoji: "🧅",
    category: "cu-qua",
    aliases: ["củ hành tây"],
  },
  {
    id: "khom",
    name: "Thơm (dứa)",
    emoji: "🍍",
    category: "cu-qua",
    aliases: ["dứa", "thơm"],
  },
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
  {
    id: "trung-ga",
    name: "Trứng gà",
    emoji: "🥚",
    category: "trung-sua",
    aliases: ["trứng", "trứng vịt", "trứng cút"],
  },
  {
    id: "dau-hu",
    name: "Đậu hũ",
    emoji: "🧈",
    category: "trung-sua",
    aliases: ["đậu phụ", "tàu hũ", "đậu hủ"],
  },
  { id: "sua-tuoi", name: "Sữa tươi", emoji: "🥛", category: "trung-sua" },

  // Đồ khô
  { id: "gao", name: "Gạo", emoji: "🍚", category: "kho", staple: true },
  { id: "bun", name: "Bún", emoji: "🍜", category: "kho" },
  { id: "mien", name: "Miến", emoji: "🍜", category: "kho" },
  {
    id: "banh-pho",
    name: "Bánh phở",
    emoji: "🍜",
    category: "kho",
    aliases: ["phở", "hủ tiếu"],
  },
  {
    id: "lac",
    name: "Lạc (đậu phộng)",
    emoji: "🥜",
    category: "kho",
    aliases: ["đậu phộng"],
  },
  { id: "banh-mi", name: "Bánh mì", emoji: "🥖", category: "kho" },
  {
    id: "mi-goi",
    name: "Mì gói",
    emoji: "🍜",
    category: "kho",
    aliases: ["mì tôm", "mì ăn liền"],
  },
  { id: "yen-mach", name: "Yến mạch", emoji: "🥣", category: "kho" },

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
  khac: "Tự thêm",
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

/**
 * Tìm nguyên liệu theo tên hoặc tên gọi khác, không cần gõ dấu.
 * Dùng cho ô "điền nguyên liệu" để tránh tạo trùng ("đậu phụ" -> Đậu hũ).
 */
export function searchIngredients(query: string, limit = 6): Ingredient[] {
  const q = normalizeText(query);
  if (!q) return [];

  const scored = INGREDIENTS.map((ingredient) => {
    const names = [ingredient.name, ...(ingredient.aliases ?? [])].map(
      normalizeText,
    );
    let score = -1;
    for (const name of names) {
      if (name === q) score = Math.max(score, 3);
      else if (name.startsWith(q)) score = Math.max(score, 2);
      else if (name.includes(q)) score = Math.max(score, 1);
    }
    return { ingredient, score };
  }).filter((item) => item.score > 0);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.ingredient);
}

/** Có nguyên liệu nào trùng khớp tuyệt đối với tên người dùng gõ không */
export function findIngredientByName(name: string): Ingredient | undefined {
  const q = normalizeText(name);
  return INGREDIENTS.find((ingredient) =>
    [ingredient.name, ...(ingredient.aliases ?? [])].some(
      (value) => normalizeText(value) === q,
    ),
  );
}
