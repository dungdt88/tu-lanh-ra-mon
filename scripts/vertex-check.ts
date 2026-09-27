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
        generationConfig: { temperature: 0, maxOutputTokens: 16 },
      },
      20_000,
    );
    console.log(`✓ Vertex trả lời: ${layText(data).trim()}`);
    console.log("\nVertex AI OK.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${message}\n`);
    console.error("Thường do một trong những nguyên nhân:");
    console.error("  - Chưa bật Vertex AI API cho project");
    console.error("  - Service account thiếu role roles/aiplatform.user");
    console.error(`  - Model "${cau.model}" không có ở vùng ${cau.location}`);
    console.error("  - File khoá sai đường dẫn hoặc sai project");
    console.error("  - Project chưa bật billing");
    process.exitCode = 1;
  }
}

main();
