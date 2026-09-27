import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/repo/catalog";
import { hasGemini } from "@/lib/gemini";
import { chatWithGemini, type RawChatResult } from "@/lib/gemini-chat";
import { traLoiMoPhong } from "@/lib/chat-mock";
import type { ChatRequest, ChatResponse, DishProposal } from "@/lib/chat-api";

/**
 * Một lượt chat với trợ lý bếp.
 * - Có GEMINI_API_KEY: gọi Gemini thật.
 * - Chưa có key (hoặc Gemini lỗi): trả lời mô phỏng để app vẫn dùng được.
 *
 * Mọi id nguyên liệu / id món do AI trả về đều được đối chiếu lại với danh mục
 * thật ở đây. Đây là rào chắn chính: app nấu ăn mà để AI bịa nguyên liệu thì
 * người dị ứng có thể bị bỏ sót.
 */

const MAX_MESSAGES = 10;
const MAX_LEN = 2000;

function keepKnown(
  ids: unknown,
  known: Set<string>,
  dropped: string[],
): string[] | undefined {
  if (!Array.isArray(ids)) return undefined;
  const out: string[] = [];
  for (const raw of ids) {
    const id = String(raw);
    if (known.has(id)) {
      if (!out.includes(id)) out.push(id);
    } else if (!dropped.includes(id)) {
      dropped.push(id);
    }
  }
  return out;
}

function cleanStrings(value: unknown, limit: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0 && v.length <= 300)
    .slice(0, limit);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChatRequest | null;

  if (!body || (body.scope !== "dish" && body.scope !== "meal")) {
    return NextResponse.json({ error: "Thiếu scope" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content.slice(0, MAX_LEN),
    }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "Chưa có nội dung" }, { status: 400 });
  }

  const catalog = await getCatalog();
  const ingredientIds = new Set(catalog.ingredients.map((i) => i.id));
  const dishIds = new Set(catalog.dishes.map((d) => d.id));

  // ---------------------------------------------------------------- Gemini
  if (hasGemini) {
    try {
      const raw: RawChatResult = await chatWithGemini(
        { ...body, messages },
        catalog,
      );
      const dropped: string[] = [];
      const reply = String(raw.reply ?? "").trim() || "Mình chưa rõ ý lắm.";

      if (body.scope === "dish") {
        let dishProposal: DishProposal | undefined;

        if (raw.changed) {
          const core = keepKnown(raw.core, ingredientIds, dropped);
          const optional = keepKnown(raw.optional, ingredientIds, dropped);
          const steps = cleanStrings(raw.steps, 15);
          const minutes =
            typeof raw.minutes === "number" && raw.minutes > 0
              ? Math.min(360, Math.round(raw.minutes))
              : undefined;

          const hasChange =
            core ||
            optional ||
            steps ||
            minutes ||
            raw.name ||
            raw.summary ||
            raw.tip;

          if (hasChange) {
            dishProposal = {
              note: String(raw.note ?? "").trim() || "Đã chỉnh lại món",
              name: raw.name?.trim() || undefined,
              summary: raw.summary?.trim() || undefined,
              minutes,
              // core rỗng nghĩa là AI bỏ hết nguyên liệu chính -> vô lý, không nhận
              core: core && core.length > 0 ? core : undefined,
              optional,
              steps: steps && steps.length > 0 ? steps : undefined,
              tip: raw.tip?.trim() || undefined,
            };
          }
        }

        return NextResponse.json({
          source: "gemini",
          reply,
          dishProposal,
          dropped: dropped.length ? dropped : undefined,
        } satisfies ChatResponse);
      }

      const avoid = keepKnown(raw.avoid, ingredientIds, dropped) ?? [];
      const notes = cleanStrings(raw.notes, 8) ?? [];
      const picked = keepKnown(raw.picked, dishIds, dropped)?.slice(0, 4);

      return NextResponse.json({
        source: "gemini",
        reply,
        prefsProposal:
          avoid.length || notes.length ? { avoid, notes } : undefined,
        pickedDishIds: picked?.length ? picked : undefined,
        dropped: dropped.length ? dropped : undefined,
      } satisfies ChatResponse);
    } catch (error) {
      console.error(
        "[chat] Gemini lỗi, tạm trả lời mô phỏng:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // ------------------------------------------------------------------ mock
  // Trả lời sẵn: đủ để bấm thử luồng chỉnh món và ràng buộc cả nhà mà không
  // cần key. Xem src/lib/chat-mock.ts.
  return NextResponse.json(
    traLoiMoPhong(
      {
        scope: body.scope,
        messages,
        dish: body.dish,
        pantry: body.pantry,
        prefs: body.prefs,
      },
      catalog,
      hasGemini,
    ) satisfies ChatResponse,
  );
}
