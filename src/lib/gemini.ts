import "server-only";
import { coVertex, goiVertex, layText, type CauHinhVertex } from "@/lib/vertex";

/**
 * Cấu hình Gemini qua Vertex AI cho việc đọc ảnh tủ lạnh.
 * Chưa cấu hình đủ thì API nhận diện chạy bằng dữ liệu mô phỏng, app vẫn dùng
 * được bình thường.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const VERTEX: CauHinhVertex = {
  project: process.env.GOOGLE_CLOUD_PROJECT ?? "",
  location: process.env.GOOGLE_CLOUD_LOCATION || "asia-southeast1",
  model: GEMINI_MODEL,
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
  accessToken: process.env.VERTEX_ACCESS_TOKEN || undefined,
};

export const hasGemini = coVertex(VERTEX);

export type DetectedIngredient = {
  /** id trong danh mục, hoặc custom-<slug> nếu Gemini thấy thứ ngoài danh mục */
  id: string;
  name: string;
  emoji: string;
  confidence: number;
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
  const data = await goiVertex(
    VERTEX,
    {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: buildPrompt(catalog) },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    },
    // ảnh tủ lạnh thường nặng, cho thoáng thời gian
    30_000,
  );

  const text = layText(data);

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
