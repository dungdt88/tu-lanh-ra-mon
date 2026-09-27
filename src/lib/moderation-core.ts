import { normalizeText } from "@/lib/text";
import { coVertex, goiVertex, type CauHinhVertex } from "@/lib/vertex";

/**
 * Cấu hình Vertex truyền từ ngoài vào, không đọc thẳng process.env: module này
 * dùng chung cho server action (`moderation.ts`) và script quét lại chạy ở máy.
 */
export type CauHinhKiemDuyet = CauHinhVertex;

export type LoaiNoiDung = "bai" | "binh-luan" | "cong-thuc";

export type KetQuaKiemDuyet = { ok: boolean; lyDo?: string };

const HOP_LE: KetQuaKiemDuyet = { ok: true };

const NHAN: Record<LoaiNoiDung, string> = {
  bai: "một bài khoe mâm cơm",
  "binh-luan": "một bình luận dưới bài khoe món",
  "cong-thuc": "một công thức nấu ăn được chia sẻ công khai",
};

/**
 * Lưới lọc chạy khi chưa cấu hình Vertex, và chạy trước cả khi có: bắt được
 * ngay thì khỏi tốn một lượt gọi mạng. Cố tình chỉ gồm từ thô tục rõ ràng -
 * lọc rộng hơn sẽ chặn nhầm người kể chuyện bếp núc.
 */
const TU_CAM = [
  "dit me",
  "du ma",
  "do cho",
  "con cho",
  "thang cho",
  "cai lon",
  "con dine",
  "phim sex",
  "khieu dam",
  "ma tuy",
  "danh bac",
  "ca do bong da",
  "vay tien nhanh",
  "kiem tien tai nha",
];

function loiVanBan(text: string): string | null {
  const sach = normalizeText(text);
  const hit = TU_CAM.find((tu) => sach.includes(tu));
  return hit ? "Nội dung có từ ngữ không phù hợp." : null;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    ok: { type: "BOOLEAN" },
    lyDo: { type: "STRING" },
  },
  required: ["ok"],
} as const;

const LUAT = [
  "Chặn khi có: chửi bới, thoá mạ, công kích người khác; nội dung tình dục;",
  "bạo lực, máu me; quảng cáo, bán hàng, mời vay tiền, cờ bạc, link lạ;",
  "thông tin cá nhân của người khác (số điện thoại, địa chỉ, tài khoản);",
  "lừa đảo hoặc nội dung nguy hiểm cho sức khoẻ.",
  "KHÔNG chặn chỉ vì: món ăn lạ, nấu vụng, chê món, than thở chuyện nhà,",
  "giọng văn suồng sã nhưng không xúc phạm ai, sai chính tả, viết không dấu.",
  "lyDo viết tiếng Việt, một câu ngắn, nói cho người đăng hiểu vì sao bị chặn.",
].join(" ");

async function hoiGemini(
  cau: CauHinhKiemDuyet,
  parts: unknown[],
): Promise<KetQuaKiemDuyet> {
  const data = await goiVertex(
    cau,
    {
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    },
    8000,
  );

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini trả lời rỗng");

  const parsed = JSON.parse(raw) as { ok?: boolean; lyDo?: string };
  if (parsed.ok === false) {
    return {
      ok: false,
      lyDo: parsed.lyDo?.trim() || "Nội dung không phù hợp.",
    };
  }
  return HOP_LE;
}

/**
 * Kiểm duyệt phần chữ trước khi lưu.
 *
 * Gemini hỏng hoặc quá hạn thì CHO QUA: đây là app nấu ăn của gia đình, chặn
 * hết bài mỗi lần Google trục trặc còn tệ hơn là lọt một bài xấu - bản quét
 * lại định kỳ (`npm run mod:scan`) sẽ nhặt nốt.
 */
export async function kiemDuyetVanBanVoi(
  cau: CauHinhKiemDuyet,
  loai: LoaiNoiDung,
  text: string,
): Promise<KetQuaKiemDuyet> {
  const noiDung = text.trim();
  if (!noiDung) return HOP_LE;

  const loi = loiVanBan(noiDung);
  if (loi) return { ok: false, lyDo: loi };

  if (!coVertex(cau)) return HOP_LE;

  try {
    return await hoiGemini(cau, [
      {
        text: [
          `Bạn là người kiểm duyệt nội dung của một ứng dụng nấu ăn gia đình Việt Nam.`,
          `Dưới đây là ${NHAN[loai]}. Quyết định có cho đăng không.`,
          LUAT,
          "",
          "Nội dung:",
          noiDung.slice(0, 4000),
        ].join("\n"),
      },
    ]);
  } catch (error) {
    console.error("[moderation] không gọi được Gemini, tạm cho qua:", error);
    return HOP_LE;
  }
}

/** Như trên nhưng cho ảnh món ăn. Cũng cho qua khi Gemini hỏng. */
export async function kiemDuyetAnhVoi(
  cau: CauHinhKiemDuyet,
  base64: string,
  mimeType: string,
): Promise<KetQuaKiemDuyet> {
  if (!coVertex(cau)) return HOP_LE;

  try {
    return await hoiGemini(cau, [
      { inlineData: { mimeType, data: base64 } },
      {
        text: [
          "Bạn là người kiểm duyệt ảnh của một ứng dụng nấu ăn gia đình Việt Nam.",
          "Ảnh này được đăng kèm bài khoe mâm cơm. Quyết định có cho đăng không.",
          "Chặn khi ảnh có: khoả thân hoặc hở hang, bạo lực, máu me, xác động vật",
          "bị hành hạ, ảnh giấy tờ tuỳ thân, quảng cáo, hoặc ảnh rác không liên quan",
          "tới đồ ăn và bếp núc.",
          "KHÔNG chặn chỉ vì: ảnh mờ, món trông không ngon, bếp bừa, có người trong",
          "ảnh đang ăn uống bình thường, thịt cá sống dùng để nấu.",
          "lyDo viết tiếng Việt, một câu ngắn.",
        ].join(" "),
      },
    ]);
  } catch (error) {
    console.error("[moderation] không xem được ảnh, tạm cho qua:", error);
    return HOP_LE;
  }
}
