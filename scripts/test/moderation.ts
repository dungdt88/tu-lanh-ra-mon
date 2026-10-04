/**
 * Kiểm tra rào chắn kiểm duyệt: chặn đúng thứ cần chặn, và không chặn nhầm
 * chuyện bếp núc bình thường. Gemini được giả lập nên không tốn quota.
 *
 * Chạy: npm run test:mod
 */
import {
  kiemDuyetAnhVoi,
  kiemDuyetVanBanVoi,
  type CauHinhKiemDuyet,
} from "@/lib/moderation-core";

const OFFLINE: CauHinhKiemDuyet = { project: "", location: "", model: "" };
// accessToken có sẵn nên goiVertex không đi lấy token thật
const CO_KEY: CauHinhKiemDuyet = {
  project: "test-project",
  location: "asia-southeast1",
  model: "m",
  accessToken: "test-token",
};

let traLoi: unknown = { ok: true };
let sap = false;

globalThis.fetch = (async () => {
  if (sap) throw new Error("giả lập Gemini sập");
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(traLoi) }] } }],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}) as typeof fetch;

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

async function main() {
  console.log("Lưới lọc chạy khi chưa có API key");
  check(
    "bài kể chuyện bếp núc bình thường thì cho qua",
    (await kiemDuyetVanBanVoi(OFFLINE, "bai", "Tan làm muộn, kho quẹt ăn tạm"))
      .ok,
  );
  check(
    "chửi bới thì chặn",
    !(await kiemDuyetVanBanVoi(OFFLINE, "binh-luan", "Dit me nau nhu cho")).ok,
  );
  check(
    "từ cấm viết có dấu vẫn chặn",
    !(await kiemDuyetVanBanVoi(OFFLINE, "binh-luan", "địt mẹ nấu dở")).ok,
  );
  for (const cauBinhThuong of [
    "Nấu đồ cho bé ăn dặm",
    "Thế là đủ mà, khỏi nêm thêm",
    "Rau thơm mà tùy nhà, thích gì bỏ nấy",
    "Chọn cái lớn hơn cho dễ lọc xương",
    "Mỗi tháng cho con ăn cá ba lần",
  ]) {
    check(
      `không chặn nhầm: "${cauBinhThuong}"`,
      (await kiemDuyetVanBanVoi(OFFLINE, "bai", cauBinhThuong)).ok,
    );
  }
  check(
    "viết không dấu xen câu có dấu vẫn chặn",
    !(await kiemDuyetVanBanVoi(OFFLINE, "binh-luan", "dit me, nấu dở")).ok,
  );
  check(
    "dấu thanh đặt kiểu cũ vẫn chặn",
    !(await kiemDuyetVanBanVoi(OFFLINE, "bai", "Bán ma tuý giá rẻ")).ok,
  );
  check(
    "mời vay tiền thì chặn",
    !(await kiemDuyetVanBanVoi(OFFLINE, "bai", "Vay tien nhanh 0% lai suat"))
      .ok,
  );
  check(
    "nội dung rỗng thì cho qua",
    (await kiemDuyetVanBanVoi(OFFLINE, "bai", "   ")).ok,
  );
  check(
    "chưa có key thì không gọi ảnh",
    (await kiemDuyetAnhVoi(OFFLINE, "abc", "image/jpeg")).ok,
  );

  console.log("\nKhi có API key");
  traLoi = { ok: false, lyDo: "Bình luận công kích người khác." };
  const chan = await kiemDuyetVanBanVoi(CO_KEY, "binh-luan", "nấu dở quá");
  check(
    "Gemini nói không thì chặn kèm lý do",
    !chan.ok && Boolean(chan.lyDo),
    chan,
  );

  traLoi = { ok: true };
  check(
    "Gemini nói được thì cho qua",
    (await kiemDuyetVanBanVoi(CO_KEY, "bai", "Canh chua cá lóc")).ok,
  );

  traLoi = { ok: false, lyDo: "Ảnh không liên quan tới đồ ăn." };
  check(
    "ảnh bị Gemini chặn",
    !(await kiemDuyetAnhVoi(CO_KEY, "abc", "image/jpeg")).ok,
  );

  // Gemini sập mà chặn hết bài thì còn tệ hơn lọt một bài xấu
  sap = true;
  check(
    "Gemini sập thì cho qua",
    (await kiemDuyetVanBanVoi(CO_KEY, "bai", "Thịt kho tàu")).ok,
  );
  sap = false;

  console.log(`\n${pass} qua, ${fail} hỏng`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
