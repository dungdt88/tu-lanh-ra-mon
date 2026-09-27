import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const FONT_DIR = path.join(
  process.cwd(),
  "node_modules/@fontsource/be-vietnam-pro/files",
);

/** Màu nền ảnh chia sẻ - trùng với màn mở đầu và themeColor của app. */
export const OG_CAM = "#feaa03";
export const OG_MUC = "#211f1d";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Font cho ảnh chia sẻ.
 *
 * Satori không đọc được woff2 nên lấy bản woff của Fontsource. Subset
 * "vietnamese" chỉ có chữ mang dấu, nên phải kèm subset "latin" làm font
 * dự phòng, nếu không mọi chữ không dấu sẽ thành ô vuông.
 */
export async function fontChiaSe() {
  const files = [
    ["vietnamese", 700],
    ["latin", 700],
    ["vietnamese", 400],
    ["latin", 400],
  ] as const;

  const data = await Promise.all(
    files.map(([subset, weight]) =>
      readFile(
        path.join(FONT_DIR, `be-vietnam-pro-${subset}-${weight}-normal.woff`),
      ),
    ),
  );

  return files.map(([subset, weight], index) => ({
    name: subset === "vietnamese" ? "BVP VI" : "BVP Latin",
    data: data[index],
    weight,
    style: "normal" as const,
  }));
}

export const OG_FONT_FAMILY = '"BVP VI", "BVP Latin"';
