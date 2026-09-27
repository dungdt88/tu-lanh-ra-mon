/**
 * Kiểm tra Vertex AI đã cấu hình đúng chưa: lấy token, gọi một lượt
 * generateContent thật, in ra câu trả lời.
 * Chạy: npm run vertex:check   (đọc .env.local)
 *
 * Tách riêng khỏi app để biết lỗi nằm ở Google Cloud hay ở code: app luôn lùi
 * về bản mô phỏng khi Vertex hỏng nên nhìn app không đoán được.
 */
import { coVertex, goiVertex, layText, type CauHinhVertex } from "@/lib/vertex";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.log("Không thấy .env.local - sẽ đọc biến môi trường đang có.");
}

const cau: CauHinhVertex = {
  project: process.env.GOOGLE_CLOUD_PROJECT ?? "",
  location: process.env.GOOGLE_CLOUD_LOCATION || "asia-southeast1",
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
  accessToken: process.env.VERTEX_ACCESS_TOKEN || undefined,
};

/** In nguyên văn câu trả lời để đọc finishReason và usageMetadata. */
async function inRaw() {
  try {
    const data = await goiVertex(
      cau,
      {
        contents: [{ role: "user", parts: [{ text: "Trả lời đúng: OK" }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 256 },
      },
      20_000,
    );
    console.error(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`(không lấy được: ${e instanceof Error ? e.message : e})`);
  }
}

async function main() {
  console.log(`project  ${cau.project || "(trống)"}`);
  console.log(`location ${cau.location}`);
  console.log(`model    ${cau.model}`);
  console.log(`keyFile  ${cau.keyFile ?? "(dùng ADC)"}`);
  console.log("");

  if (!coVertex(cau)) {
    console.error(
      "✗ Thiếu GOOGLE_CLOUD_PROJECT trong .env.local - app sẽ chạy bản mô phỏng.",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const data = await goiVertex(
      cau,
      {
        contents: [{ role: "user", parts: [{ text: "Trả lời đúng: OK" }] }],
        // 16 token là không đủ: model biết suy luận tiêu token vào phần nghĩ
        // trước, hết hạn mức thì phần chữ trả ra rỗng.
        generationConfig: { temperature: 0, maxOutputTokens: 256 },
      },
      20_000,
    );
    console.log(`✓ Vertex trả lời: ${layText(data).trim()}`);
    console.log("\nVertex AI OK.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${message}\n`);

    // Gọi được nhưng không có chữ là chuyện khác hẳn gọi không được: đừng gợi ý
    // nhầm sang quyền hay billing khi thật ra đã qua hết những cửa đó.
    if (message.includes("không trả về nội dung")) {
      console.error("Gọi được Vertex rồi - xác thực và quyền đều OK.");
      console.error("Câu trả lời không có phần chữ. Thường do:");
      console.error("  - MAX_TOKENS: model tiêu hết token vào phần nghĩ");
      console.error("  - SAFETY: bộ lọc chặn câu trả lời");
      console.error("\nXem nguyên văn câu trả lời để biết chắc:");
      await inRaw();
    } else {
      console.error("Thường do một trong những nguyên nhân:");
      console.error("  - Chưa bật Vertex AI API cho project");
      console.error("  - Tài khoản thiếu role roles/aiplatform.user");
      console.error(`  - Model "${cau.model}" không có ở vùng ${cau.location}`);
      console.error("  - Chưa chạy gcloud auth application-default login");
      console.error(
        "  - Chưa set-quota-project, hoặc project chưa bật billing",
      );
    }
    process.exitCode = 1;
  }
}

main();
