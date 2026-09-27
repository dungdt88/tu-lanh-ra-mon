import { ImageResponse } from "next/og";
import { getPost } from "@/lib/repo/feed";
import { OG_CAM, OG_FONT_FAMILY, OG_MUC, OG_SIZE, fontChiaSe } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Món ăn vừa được khoe trên Tủ Lạnh Ra Món";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id, null);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: OG_CAM,
        color: OG_MUC,
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      {post?.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          width={520}
          height={630}
          style={{ width: 520, height: 630, objectFit: "cover" }}
        />
      )}

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 5,
          }}
        >
          TỦ LẠNH RA MÓN
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {post?.dishName ?? "Bài đã bị xoá"}
          </div>
          {post?.caption && (
            <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>
              {post.caption.slice(0, 120)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
          {post ? `bếp ${post.author.name}` : ""}
        </div>
      </div>
    </div>,
    { ...size, fonts: await fontChiaSe() },
  );
}
