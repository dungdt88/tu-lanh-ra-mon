import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Cho HEALTHCHECK của Docker. Cố tình không hỏi Supabase hay Vertex: chúng
 * trục trặc thì app vẫn chạy bằng dữ liệu mock, không có lý do để Docker coi
 * container là hỏng.
 */
export function GET() {
  return NextResponse.json({ ok: true });
}
