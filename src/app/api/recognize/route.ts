import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/repo/catalog";
import {
  hasGemini,
  recognizeWithGemini,
  type DetectedIngredient,
} from "@/lib/gemini";
import { slugify } from "@/lib/text";

/**
 * Nhận diện nguyên liệu từ ảnh tủ lạnh.
 * - Có GEMINI_API_KEY: gọi Gemini đọc ảnh thật.
 * - Chưa có key (hoặc Gemini lỗi): trả danh sách mô phỏng để app vẫn dùng được.
 */

const MOCK_POOL = [
  "trung-ga",
  "ca-chua",
  "thit-ba-chi",
  "thit-bam",
  "rau-muong",
  "cai-thao",
  "bi-xanh",
  "ca-rot",
  "dau-hu",
  "tom",
  "dui-ga",
  "hanh-tay",
  "khoai-tay",
  "su-su",
  "nam-rom",
  "dau-que",
  "mong-toi",
  "bap-cai",
  "suon-non",
  "ca-basa",
];

function pseudoRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export async function POST(request: Request) {
  const { ingredients } = await getCatalog();
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");

  // ---------------------------------------------------------------- Gemini
  if (hasGemini && file instanceof File) {
    try {
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const raw = await recognizeWithGemini(
        base64,
        file.type || "image/jpeg",
        ingredients.map((i) => ({ id: i.id, name: i.name })),
      );

      const seen = new Set<string>();
      const detected: DetectedIngredient[] = [];

      for (const item of raw) {
        const known = byId.get(item.id);
        // Gemini thấy thứ ngoài danh mục -> giữ lại dưới dạng nguyên liệu tự thêm
        const id = known?.id ?? `custom-${slugify(item.name)}`;
        if (!id || id === "custom-" || seen.has(id)) continue;
        seen.add(id);

        detected.push({
          id,
          name: known?.name ?? item.name,
          emoji: known?.emoji ?? "🥘",
          confidence: item.confidence,
        });
      }

      if (detected.length > 0) {
        return NextResponse.json({
          source: "gemini" as const,
          detected: detected.sort((a, b) => b.confidence - a.confidence),
        });
      }

      return NextResponse.json({ source: "gemini" as const, detected: [] });
    } catch (error) {
      console.error(
        "[recognize] Gemini lỗi, tạm dùng bản mô phỏng:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // ------------------------------------------------------------------ mock
  const seed =
    file instanceof File ? file.size + file.name.length : Date.now() % 100000;
  const random = pseudoRandom(seed || 42);
  const pool = MOCK_POOL.filter((id) => byId.has(id)).sort(
    () => random() - 0.5,
  );
  const count = 5 + Math.floor(random() * 4);

  const detected: DetectedIngredient[] = pool.slice(0, count).map((id) => {
    const ingredient = byId.get(id);
    return {
      id,
      name: ingredient?.name ?? id,
      emoji: ingredient?.emoji ?? "🥘",
      confidence: Number((0.62 + random() * 0.36).toFixed(2)),
    };
  });

  await new Promise((resolve) => setTimeout(resolve, 450));

  return NextResponse.json({
    source: "mock" as const,
    detected: detected.sort((a, b) => b.confidence - a.confidence),
  });
}
