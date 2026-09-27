import "server-only";
import { VERTEX } from "@/lib/gemini";
import { goiVertex, layText } from "@/lib/vertex";
import type { ChatRequest } from "@/lib/chat-api";
import type { Dish, Ingredient } from "@/lib/types";

type GeminiContent = { role: "user" | "model"; parts: { text?: string }[] };

const DISH_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    changed: { type: "BOOLEAN" },
    note: { type: "STRING" },
    name: { type: "STRING" },
    summary: { type: "STRING" },
    minutes: { type: "NUMBER" },
    core: { type: "ARRAY", items: { type: "STRING" } },
    optional: { type: "ARRAY", items: { type: "STRING" } },
    steps: { type: "ARRAY", items: { type: "STRING" } },
    tip: { type: "STRING" },
  },
  required: ["reply", "changed"],
} as const;

const MEAL_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    avoid: { type: "ARRAY", items: { type: "STRING" } },
    notes: { type: "ARRAY", items: { type: "STRING" } },
    picked: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["reply"],
} as const;

function ingredientList(ingredients: Ingredient[]): string {
  return ingredients.map((i) => `${i.id} = ${i.name}`).join("\n");
}

function dishList(dishes: Dish[]): string {
  return dishes
    .map((d) => `${d.id} = ${d.name} (${d.role}, ${d.minutes} phút)`)
    .join("\n");
}

function dishSystemPrompt(dish: Dish, ingredients: Ingredient[]): string {
  return [
    "Bạn là trợ lý bếp của một app nấu ăn gia đình Việt Nam.",
    "Người dùng đang xem một món và muốn chỉnh lại cho hợp nhà mình.",
    "",
    "Món hiện tại (JSON):",
    JSON.stringify(
      {
        name: dish.name,
        summary: dish.summary,
        minutes: dish.minutes,
        servings: dish.servings,
        core: dish.core,
        optional: dish.optional,
        steps: dish.steps,
        tip: dish.tip,
      },
      null,
      1,
    ),
    "",
    "QUY TẮC BẮT BUỘC:",
    "- core và optional CHỈ được chứa id có trong danh mục nguyên liệu bên dưới.",
    "  Tuyệt đối không bịa id mới. Không chắc thì bỏ nguyên liệu đó ra khỏi danh sách",
    "  và nói rõ trong reply.",
    "- Khi người dùng nói dị ứng hoặc không ăn được thứ gì: bỏ thứ đó khỏi CẢ core",
    "  VÀ optional, đồng thời sửa lại các bước nấu cho khớp. Nói rõ đã bỏ gì.",
    "- steps viết tiếng Việt, mỗi bước một câu ngắn, có định lượng và thời gian.",
    "- Chỉ trả những trường thực sự thay đổi. Trường không đổi thì bỏ trống.",
    "- changed = false khi người dùng chỉ hỏi han, không yêu cầu sửa món.",
    "- note: một câu tóm tắt đã đổi gì, ví dụ 'Bỏ tôm, thay bằng thịt băm'.",
    "- reply: trả lời thân mật, ngắn, xưng 'mình'. Không nhắc tới id nguyên liệu.",
    "",
    "Danh mục nguyên liệu:",
    ingredientList(ingredients),
  ].join("\n");
}

function mealSystemPrompt(
  dishes: Dish[],
  ingredients: Ingredient[],
  pantry: string[],
  prefs: { avoid: string[]; notes: string[] },
): string {
  return [
    "Bạn là trợ lý bếp của một app nấu ăn gia đình Việt Nam.",
    "Người dùng nói về thói quen và ràng buộc ăn uống của nhà mình,",
    "nhiệm vụ của bạn là ghi nhận ràng buộc đó và gợi ý món từ danh mục có sẵn.",
    "",
    `Nguyên liệu đang có trong tủ: ${pantry.length ? pantry.join(", ") : "(chưa khai)"}`,
    `Đang tránh: ${prefs.avoid.length ? prefs.avoid.join(", ") : "(chưa có)"}`,
    `Ghi chú đã lưu: ${prefs.notes.length ? prefs.notes.join(" | ") : "(chưa có)"}`,
    "",
    "QUY TẮC BẮT BUỘC:",
    "- avoid CHỈ chứa id có trong danh mục nguyên liệu. Không bịa id.",
    "- picked CHỈ chứa id có trong danh sách món. Tối đa 4 món, không trùng nhau.",
    "  Ưu tiên món dùng được nguyên liệu đang có trong tủ.",
    "- notes: ghi chú ngắn bằng tiếng Việt cho thứ không quy về nguyên liệu được,",
    "  ví dụ 'thứ 2 ăn chay', 'nhà có bé 2 tuổi'. Mỗi ghi chú một câu ngắn.",
    "- Chỉ thêm vào avoid/notes thứ người dùng vừa nói. Không lặp lại cái đã lưu.",
    "- reply: trả lời thân mật, ngắn, xưng 'mình'. Không nhắc tới id.",
    "",
    "Danh mục nguyên liệu:",
    ingredientList(ingredients),
    "",
    "Danh sách món:",
    dishList(dishes),
  ].join("\n");
}

export type RawChatResult = {
  reply?: string;
  changed?: boolean;
  note?: string;
  name?: string;
  summary?: string;
  minutes?: number;
  core?: string[];
  optional?: string[];
  steps?: string[];
  tip?: string;
  avoid?: string[];
  notes?: string[];
  picked?: string[];
};

/**
 * Gọi Gemini cho một lượt chat. Ném lỗi khi hỏng để route tự lùi về bản mô phỏng.
 */
export async function chatWithGemini(
  request: ChatRequest,
  catalog: { dishes: Dish[]; ingredients: Ingredient[] },
): Promise<RawChatResult> {
  const isDish = request.scope === "dish" && request.dish;

  const system = isDish
    ? dishSystemPrompt(request.dish!, catalog.ingredients)
    : mealSystemPrompt(
        catalog.dishes,
        catalog.ingredients,
        request.pantry ?? [],
        request.prefs ?? { avoid: [], notes: [] },
      );

  const contents: GeminiContent[] = request.messages.map((turn) => ({
    role: turn.role === "user" ? "user" : "model",
    parts: [{ text: turn.content }],
  }));

  const data = await goiVertex(
    VERTEX,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: isDish ? DISH_SCHEMA : MEAL_SCHEMA,
        temperature: 0.4,
      },
    },
    30_000,
  );

  return JSON.parse(layText(data)) as RawChatResult;
}
