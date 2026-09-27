import { GoogleAuth } from "google-auth-library";

/**
 * Lớp gọi Vertex AI dùng chung. Cố tình KHÔNG `import "server-only"`: script
 * quét lại chạy ở máy (`npm run mod:scan`) cũng dùng module này, mà script thì
 * resolve `server-only` ra package thật rồi nổ.
 *
 * Vertex khác AI Studio ở hai điểm: endpoint mang project + location, và xác
 * thực bằng OAuth bearer token thay vì API key.
 */
export type CauHinhVertex = {
  project: string;
  location: string;
  model: string;
  /** Đường dẫn file khoá service account. Trống thì để ADC tự tìm. */
  keyFile?: string;
  /**
   * Token có sẵn, dùng thay cho việc tự ký từ file khoá. Test đặt giá trị giả
   * vào đây để không phải gọi mạng lấy token.
   */
  accessToken?: string;
};

export type VertexResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  usageMetadata?: Record<string, number>;
  error?: { message?: string };
};

export function coVertex(cau: CauHinhVertex): boolean {
  return Boolean(cau.project && cau.location && cau.model);
}

// Token sống 1 giờ. Giữ lại và chỉ lấy mới khi gần hết hạn, nếu không mỗi lượt
// chat lại tốn một vòng ký JWT + đổi token.
let cache: { token: string; hetHan: number } | null = null;
let auth: GoogleAuth | null = null;

const LE_AN_TOAN_MS = 60_000;

async function layToken(cau: CauHinhVertex): Promise<string> {
  if (cau.accessToken) return cau.accessToken;

  const gio = Date.now();
  if (cache && cache.hetHan - LE_AN_TOAN_MS > gio) return cache.token;

  auth ??= new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    ...(cau.keyFile ? { keyFile: cau.keyFile } : {}),
  });

  const client = await auth.getClient();
  const res = await client.getAccessToken();

  if (!res.token) {
    throw new Error(
      "Không lấy được access token của Google Cloud. Kiểm tra GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  // getAccessToken() không trả hạn dùng, đọc từ credentials của client
  const expiry = (client.credentials?.expiry_date as number | undefined) ?? 0;
  cache = { token: res.token, hetHan: expiry || gio + 3_000_000 };

  return res.token;
}

/** Chỉ để test dọn trạng thái giữa các trường hợp. */
export function xoaCacheToken(): void {
  cache = null;
  auth = null;
}

function dungUrl(cau: CauHinhVertex): string {
  // location "global" đi qua host không có tiền tố vùng
  const host =
    cau.location === "global"
      ? "https://aiplatform.googleapis.com"
      : `https://${cau.location}-aiplatform.googleapis.com`;

  return (
    `${host}/v1/projects/${cau.project}/locations/${cau.location}` +
    `/publishers/google/models/${cau.model}:generateContent`
  );
}

/**
 * Gọi generateContent trên Vertex. Ném lỗi khi hỏng để phía gọi tự lùi về bản
 * mô phỏng — app không bao giờ hiện màn lỗi vì AI.
 */
export async function goiVertex(
  cau: CauHinhVertex,
  body: unknown,
  timeoutMs: number,
): Promise<VertexResponse> {
  const token = await layToken(cau);

  const response = await fetch(dungUrl(cau), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = (await response.json()) as VertexResponse;

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message ?? `Vertex trả về HTTP ${response.status}`,
    );
  }

  return data;
}

/**
 * Lấy phần text đầu tiên trong câu trả lời.
 *
 * Kèm finishReason vào lỗi vì nguyên nhân hay gặp nhất là MAX_TOKENS trên model
 * biết suy luận: nó tiêu token vào phần nghĩ trước, hết hạn mức thì không còn
 * token nào cho phần chữ trả ra. Thiếu finishReason thì lỗi này trông y hệt lỗi
 * mạng hoặc lỗi quyền.
 */
export function layText(data: VertexResponse): string {
  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  if (text) return text;

  const ly = data.candidates?.[0]?.finishReason;
  throw new Error(
    ly
      ? `Vertex không trả về nội dung (finishReason: ${ly})`
      : "Vertex không trả về nội dung",
  );
}
