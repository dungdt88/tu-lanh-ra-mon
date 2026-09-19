import type { ChatRole, ChatScope, Dish, HouseholdPrefs } from "@/lib/types";

/** Kiểu dữ liệu đi qua POST /api/chat - dùng chung cho cả client và route. */

export type ChatTurn = { role: ChatRole; content: string };

export type ChatRequest = {
  scope: ChatScope;
  messages: ChatTurn[];
  /** scope "dish": món đang xem, đã đắp bản chỉnh trước đó nếu có */
  dish?: Dish;
  /** id nguyên liệu đang có trong tủ lạnh */
  pantry?: string[];
  prefs?: HouseholdPrefs;
};

/** Đề xuất sửa món - KHÔNG tự áp dụng, phải người dùng bấm đồng ý */
export type DishProposal = {
  note: string;
  name?: string;
  summary?: string;
  minutes?: number;
  core?: string[];
  optional?: string[];
  steps?: string[];
  tip?: string;
};

export type PrefsProposal = { avoid: string[]; notes: string[] };

export type ChatResponse = {
  source: "gemini" | "mock";
  reply: string;
  dishProposal?: DishProposal;
  prefsProposal?: PrefsProposal;
  /** Món AI gợi ý, đã đối chiếu với danh mục thật */
  pickedDishIds?: string[];
  /** Nguyên liệu AI nhắc tới nhưng không có trong danh mục - đã loại */
  dropped?: string[];
};
