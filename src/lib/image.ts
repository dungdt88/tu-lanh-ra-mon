const CANH_TOI_DA = 1600;
const CHAT_LUONG = 0.82;

/**
 * Thu nhỏ ảnh ngay trên máy trước khi tải lên.
 *
 * Ảnh chụp bằng điện thoại thường 3-8MB; mạng 3G tải lên mất cả phút và bucket
 * chặn ở 5MB. Nén về cạnh dài 1600px là vừa đủ nét cho khung 4:3 trên feed.
 */
export async function nenAnh(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(
    1,
    CANH_TOI_DA / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CHAT_LUONG),
  );
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}
