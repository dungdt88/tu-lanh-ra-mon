/**
 * Kiểm tra rào chắn của POST /api/chat: AI không được bịa id nguyên liệu hay id món.
 * Dùng response Gemini giả nên không tốn quota, không cần API key.
 *
 * Chạy: npm run test:chat
 */
process.env.GOOGLE_CLOUD_PROJECT = "test-project";
process.env.GOOGLE_CLOUD_LOCATION = "asia-southeast1";
// Token giả: có sẵn thì vertex.ts không đi ký JWT lấy token thật
process.env.VERTEX_ACCESS_TOKEN = "test-token";
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let nextPayload: unknown = {};
let shouldFail = false;

globalThis.fetch = (async () => {
  if (shouldFail) throw new Error("giả lập Gemini sập");
  return new Response(
    JSON.stringify({
      candidates: [
        { content: { parts: [{ text: JSON.stringify(nextPayload) }] } },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}) as typeof fetch;

function req(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, got?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label} -> ${JSON.stringify(got)}`);
  }
}

(async () => {
  const { POST } = await import("@/app/api/chat/route");
  const { DISHES } = await import("@/data/dishes");
  const tom = DISHES.find((d) => d.id === "tom-rang-thit")!;
  const dishBody = (content: string) => ({
    scope: "dish",
    dish: tom,
    messages: [{ role: "user", content }],
  });

  console.log("\n[1] AI trả id nguyên liệu bịa -> phải bị loại");
  nextPayload = {
    reply: "Mình đổi tôm sang thịt băm nhé",
    changed: true,
    note: "Bỏ tôm",
    core: ["thit-bam", "ga-quay-bia-hoi"],
    optional: ["hanh-la", "nguyen-lieu-ma"],
    steps: ["Ướp thịt băm 10 phút.", "Xào chín."],
  };
  let r = await (await POST(req(dishBody("bỏ tôm")))).json();
  check(
    "core chỉ còn id thật",
    JSON.stringify(r.dishProposal?.core) === '["thit-bam"]',
    r.dishProposal?.core,
  );
  check(
    "optional chỉ còn id thật",
    JSON.stringify(r.dishProposal?.optional) === '["hanh-la"]',
    r.dishProposal?.optional,
  );
  check("báo đã loại 2 id", r.dropped?.length === 2, r.dropped);
  check(
    "không có tôm",
    !r.dishProposal?.core?.includes("tom"),
    r.dishProposal?.core,
  );

  console.log("\n[2] AI trả core toàn id bịa -> không nhận core rỗng");
  nextPayload = {
    reply: "xong",
    changed: true,
    note: "x",
    core: ["abc", "xyz"],
    steps: ["b1"],
  };
  r = await (await POST(req(dishBody("đổi hết")))).json();
  check(
    "core bị bỏ, không lưu mảng rỗng",
    r.dishProposal?.core === undefined,
    r.dishProposal?.core,
  );

  console.log("\n[3] changed=false -> không đề xuất sửa món");
  nextPayload = { reply: "Ăn với cơm nóng là ngon nhất.", changed: false };
  r = await (await POST(req(dishBody("ăn với gì ngon?")))).json();
  check("không có dishProposal", r.dishProposal === undefined, r.dishProposal);
  check("vẫn có lời đáp", typeof r.reply === "string" && r.reply.length > 0);

  console.log("\n[4] scope meal -> lọc id nguyên liệu và id món");
  nextPayload = {
    reply: "Mình nhớ rồi",
    avoid: ["tom", "cua-hoang-de"],
    notes: ["nhà có bé 2 tuổi"],
    picked: ["thit-kho-trung", "mon-khong-ton-tai", "canh-trung-ca-chua"],
  };
  r = await (
    await POST(
      req({
        scope: "meal",
        pantry: ["trung-ga"],
        prefs: { avoid: [], notes: [] },
        messages: [{ role: "user", content: "không ăn hải sản" }],
      }),
    )
  ).json();
  check(
    "avoid chỉ còn id thật",
    JSON.stringify(r.prefsProposal?.avoid) === '["tom"]',
    r.prefsProposal?.avoid,
  );
  check(
    "giữ ghi chú tự do",
    r.prefsProposal?.notes?.length === 1,
    r.prefsProposal?.notes,
  );
  check(
    "picked chỉ còn món có thật",
    r.pickedDishIds?.length === 2,
    r.pickedDishIds,
  );

  console.log("\n[5] Gemini sập -> lùi về bản mô phỏng, không vỡ");
  shouldFail = true;
  r = await (await POST(req(dishBody("bỏ tôm")))).json();
  check("source = mock", r.source === "mock", r.source);
  check("có lời xin lỗi", typeof r.reply === "string" && r.reply.length > 0);
  shouldFail = false;

  console.log("\n[6] body hỏng -> 400");
  const res = await POST(req({ messages: [] }));
  check("HTTP 400", res.status === 400, res.status);

  console.log(`\n===== ${pass} đạt, ${fail} hỏng`);
  process.exit(fail === 0 ? 0 : 1);
})();
