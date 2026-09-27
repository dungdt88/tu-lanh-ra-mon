import { ImageResponse } from "next/og";
import { getDishBySlug } from "@/data/dishes";
import { OG_CAM, OG_FONT_FAMILY, OG_MUC, OG_SIZE, fontChiaSe } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Công thức món ăn trên Tủ Lạnh Ra Món";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = getDishBySlug(slug);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: OG_CAM,
        color: OG_MUC,
        padding: 72,
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 6,
        }}
      >
        TỦ LẠNH RA MÓN
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {dish?.name ?? "Không tìm thấy món"}
        </div>
        {dish && (
          <div style={{ display: "flex", fontSize: 36, opacity: 0.85 }}>
            {dish.summary}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 32, fontSize: 32, fontWeight: 700 }}>
        {dish && <span>{dish.minutes} phút</span>}
        {dish && <span>{dish.servings} người ăn</span>}
        {dish && <span>{dish.nutrition.kcal} kcal</span>}
      </div>
    </div>,
    { ...size, fonts: await fontChiaSe() },
  );
}
