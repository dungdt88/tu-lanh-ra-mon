import { NextResponse } from "next/server";
import { INGREDIENTS } from "@/data/ingredients";

/**
 * Nhận diện nguyên liệu từ ảnh tủ lạnh - BẢN MOCK.
 *
 * Giai đoạn sau chỉ cần thay phần thân hàm này bằng lời gọi vision API
 * (Claude / GPT vision), giữ nguyên response shape để UI không phải sửa.
 */

const CANDIDATE_POOL = [
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
  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  const seed =
    file instanceof File ? file.size + file.name.length : Date.now() % 100000;

  const random = pseudoRandom(seed || 42);
  const pool = [...CANDIDATE_POOL].sort(() => random() - 0.5);
  const count = 5 + Math.floor(random() * 4); // 5-8 nguyên liệu

  const detected = pool.slice(0, count).map((id) => {
    const ingredient = INGREDIENTS.find((i) => i.id === id);
    return {
      id,
      name: ingredient?.name ?? id,
      emoji: ingredient?.emoji ?? "🥘",
      confidence: Number((0.62 + random() * 0.36).toFixed(2)),
    };
  });

  // giả lập độ trễ của model
  await new Promise((resolve) => setTimeout(resolve, 450));

  return NextResponse.json({
    mock: true,
    detected: detected.sort((a, b) => b.confidence - a.confidence),
  });
}
