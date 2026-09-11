import "server-only";

/**
 * Cấu hình Gemini cho việc đọc ảnh tủ lạnh.
 * Chưa có GEMINI_API_KEY thì API nhận diện chạy bằng dữ liệu mô phỏng,
 * app vẫn dùng được bình thường.
 */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
export const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";

export const hasGemini = Boolean(GEMINI_API_KEY);

export type DetectedIngredient = {
  /** id trong danh mục, hoặc custom-<slug> nếu Gemini thấy thứ ngoài danh mục */
  id: string;
  name: string;
  emoji: string;
  confidence: number;
};

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string };
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          name: { type: "STRING" },
          confidence: { type: "NUMBER" },
        },
        required: ["id", "name", "confidence"],
      },
    },
  },
  required: ["items"],
} as const;

function buildPrompt(catalog: { id: string; name: string }[]): string {
  const list = catalog.map((i) => `${i.id} = ${i.name}`).join("\n");
  return [
    "Bạn đang nhìn ảnh bên trong tủ lạnh của một gia đình Việt Nam.",
    "Liệt kê những nguyên liệu nấu ăn bạn NHÌN THẤY RÕ trong ảnh.",
    "",
    "Quy tắc:",
    "- Nếu nguyên liệu có trong danh mục dưới đây, trả đúng id của nó và name là tên trong danh mục.",
    '- Nếu thấy thứ không có trong danh mục, đặt id là "khac" và name là tên tiếng Việt ngắn gọn.',
    "- Bỏ qua đồ uống đóng chai, đồ ăn đã nấu chín, hộp nhựa rỗng.",
    "- confidence là số từ 0 đến 1 theo mức độ chắc chắn.",
    "- Tối đa 12 mục, không lặp lại.",
    "",
    "Danh mục:",
    list,
  ].join("\n");
}

/**
 * Gọi Gemini để đọc ảnh. Ném lỗi khi hỏng để phía gọi tự lùi về bản mô phỏng.
 */
export async function recognizeWithGemini(
  imageBase64: string,
  mimeType: string,
  catalog: { id: string; name: string }[],
): Promise<{ id: string; name: string; confidence: number }[]> {
  const url = `${GEMINI_BASE_URL}/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: buildPrompt(catalog) },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    }),
    // ảnh tủ lạnh thường nặng, cho thoáng thời gian
    signal: AbortSignal.timeout(30_000),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? `Gemini trả về HTTP ${response.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  if (!text) throw new Error("Gemini không trả về nội dung");

  const parsed = JSON.parse(text) as {
    items?: { id?: string; name?: string; confidence?: number }[];
  };

  return (parsed.items ?? [])
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
    }));
}
