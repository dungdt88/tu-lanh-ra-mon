import "server-only";

import { GEMINI_API_KEY, GEMINI_BASE_URL, GEMINI_MODEL } from "@/lib/gemini";
import {
  kiemDuyetAnhVoi,
  kiemDuyetVanBanVoi,
  type KetQuaKiemDuyet,
  type LoaiNoiDung,
} from "@/lib/moderation-core";

export type { KetQuaKiemDuyet, LoaiNoiDung };

const CAU_HINH = {
  apiKey: GEMINI_API_KEY,
  model: GEMINI_MODEL,
  baseUrl: GEMINI_BASE_URL,
};

/** Kiểm duyệt phần chữ trước khi lưu. Xem `moderation-core.ts` cho luật. */
export function kiemDuyetVanBan(
  loai: LoaiNoiDung,
  text: string,
): Promise<KetQuaKiemDuyet> {
  return kiemDuyetVanBanVoi(CAU_HINH, loai, text);
}

/** Như trên nhưng cho ảnh món ăn. */
export function kiemDuyetAnh(
  base64: string,
  mimeType: string,
): Promise<KetQuaKiemDuyet> {
  return kiemDuyetAnhVoi(CAU_HINH, base64, mimeType);
}
