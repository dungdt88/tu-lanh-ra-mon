/**
 * Kiểm tra bản trả lời sẵn của trợ lý (chưa cấu hình Vertex):
 * hỏi gì thì ra đề xuất nấy, và id trả ra luôn là id thật trong danh mục.
 *
 * Chạy: npm run test:mock
 */
delete process.env.GOOGLE_CLOUD_PROJECT;
delete process.env.VERTEX_ACCESS_TOKEN;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

import { POST } from "@/app/api/chat/route";
import { DISHES } from "@/data/dishes";
import { INGREDIENTS } from "@/data/ingredients";
import type { ChatResponse } from "@/lib/chat-api";

function req(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const idNguyenLieu = new Set(INGREDIENTS.map((i) => i.id));
const idMon = new Set(DISHES.map((d) => d.id));
const monThit = DISHES.find((d) => d.core.some((id) => id.startsWith("thit")));

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, got?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`, got ?? "");
  }
}

async function goi(body: unknown): Promise<ChatResponse> {
  const res = await POST(req(body));
  return (await res.json()) as ChatResponse;
}

async function main() {
  if (!monThit) throw new Error("Danh mục mock không có món nào dùng thịt");

  console.log('[1] "làm chay đi" -> đề xuất bỏ đạm động vật');
  const chay = await goi({
    scope: "dish",
    dish: monThit,
    pantry: [],
    messages: [{ role: "user", content: "làm chay đi" }],
  });
  check("source = mock", chay.source === "mock");
  check("có dishProposal", Boolean(chay.dishProposal), chay.reply);
  check(
    "core không còn thịt",
    !(chay.dishProposal?.core ?? []).some((id) => id.startsWith("thit")),
    chay.dishProposal?.core,
  );
  check(
    "core toàn id thật",
    (chay.dishProposal?.core ?? []).every((id) => idNguyenLieu.has(id)),
    chay.dishProposal?.core,
  );

  console.log('\n[2] "nấu nhanh giúp mình" -> rút thời gian');
  const nhanh = await goi({
    scope: "dish",
    dish: monThit,
    messages: [{ role: "user", content: "nhà đang vội, nấu nhanh giúp mình" }],
  });
  const phut = nhanh.dishProposal?.minutes ?? monThit.minutes;
  check("minutes giảm", phut < monThit.minutes, phut);

  console.log('\n[3] "nhà hết <nguyên liệu>" -> bỏ đúng thứ đó');
  const thieuId = monThit.core[0];
  const thieuTen = INGREDIENTS.find((i) => i.id === thieuId)?.name ?? "";
  const thieu = await goi({
    scope: "dish",
    dish: monThit,
    messages: [{ role: "user", content: `nhà hết ${thieuTen} rồi` }],
  });
  check(
    `bỏ ${thieuTen} khỏi core`,
    !(thieu.dishProposal?.core ?? [thieuId]).includes(thieuId),
    thieu.dishProposal,
  );

  console.log("\n[4] hỏi linh tinh -> vẫn trả lời, không đề xuất bừa");
  const linhTinh = await goi({
    scope: "dish",
    dish: monThit,
    messages: [{ role: "user", content: "hôm nay trời đẹp nhỉ" }],
  });
  check("không có dishProposal", !linhTinh.dishProposal, linhTinh.dishProposal);
  check("vẫn có lời đáp", linhTinh.reply.length > 0);

  console.log('\n[5] scope meal: "nhà dị ứng tôm" -> ghi ràng buộc');
  const diUng = await goi({
    scope: "meal",
    pantry: [],
    messages: [{ role: "user", content: "nhà mình dị ứng tôm nhé" }],
  });
  check(
    "avoid có tôm",
    (diUng.prefsProposal?.avoid ?? []).includes("tom"),
    diUng.prefsProposal,
  );
  check(
    "avoid toàn id thật",
    (diUng.prefsProposal?.avoid ?? []).every((id) => idNguyenLieu.has(id)),
  );
  check("có ghi chú", (diUng.prefsProposal?.notes ?? []).length > 0);

  console.log("\n[6] scope meal mặc định -> gợi ý món có thật");
  const mam = await goi({
    scope: "meal",
    pantry: ["trung-ga", "ca-chua", "rau-muong"],
    messages: [{ role: "user", content: "hôm nay ăn gì" }],
  });
  check("có món gợi ý", (mam.pickedDishIds ?? []).length > 0, mam.reply);
  check(
    "món gợi ý có thật trong danh mục",
    (mam.pickedDishIds ?? []).every((id) => idMon.has(id)),
    mam.pickedDishIds,
  );

  console.log(`\n${pass} qua, ${fail} hỏng`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
