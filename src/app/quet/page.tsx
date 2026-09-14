"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddIngredient } from "@/components/add-ingredient";
import { usePantry } from "@/lib/pantry-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

type Detected = {
  id: string;
  name: string;
  emoji: string;
  confidence: number;
};

type RecognizeResponse = {
  source: "gemini" | "mock";
  detected: Detected[];
};

export default function ScanPage() {
  const router = useRouter();
  const { add, addCustom } = usePantry();
  // Máy tính: chọn file. iPhone/iPad: mở thẳng camera (input có thuộc tính capture).
  const fileRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const mounted = useMounted();

  // pointer: coarse = màn cảm ứng (điện thoại, iPad). Chỉ đọc được ở client
  // nên chờ mounted để không lệch nội dung lúc hydrate.
  const laCamTay = mounted && window.matchMedia("(pointer: coarse)").matches;

  const [keoVao, setKeoVao] = React.useState(false);

  const [preview, setPreview] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [detected, setDetected] = React.useState<Detected[] | null>(null);
  const [source, setSource] =
    React.useState<RecognizeResponse["source"]>("mock");
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setDetected(null);
    setError(null);
    setLoading(true);

    const body = new FormData();
    body.append("image", file);

    try {
      const res = await fetch("/api/recognize", { method: "POST", body });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RecognizeResponse;
      setSource(data.source);
      setDetected(data.detected);
      setPicked(new Set(data.detected.map((d) => d.id)));
    } catch {
      setError("Không nhận diện được ảnh. Kiểm tra mạng rồi thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  /** Máy cảm ứng thì mở camera, máy tính thì mở hộp thoại chọn file */
  function moNguonAnh() {
    if (laCamTay) cameraRef.current?.click();
    else fileRef.current?.click();
  }

  function confirm() {
    const chosen = (detected ?? []).filter((item) => picked.has(item.id));

    // Thứ ngoài danh mục lưu thành nguyên liệu tự thêm để còn hiện đúng tên
    const known = chosen.filter((item) => !item.id.startsWith("custom-"));
    const custom = chosen.filter((item) => item.id.startsWith("custom-"));

    if (known.length > 0) add(...known.map((item) => item.id));
    custom.forEach((item) => addCustom(item.name));

    router.push("/");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quét tủ lạnh"
        subtitle={
          laCamTay
            ? "Chụp một tấm — app đọc ra nguyên liệu"
            : "Tải ảnh lên — app đọc ra nguyên liệu"
        }
        backHref="/"
        action={<ThemeToggle />}
      />

      <div className="space-y-4 px-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {!preview ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => moNguonAnh()}
              onDragOver={(event) => {
                event.preventDefault();
                setKeoVao(true);
              }}
              onDragLeave={() => setKeoVao(false)}
              onDrop={(event) => {
                event.preventDefault();
                setKeoVao(false);
                const file = event.dataTransfer.files?.[0];
                if (file?.type.startsWith("image/")) void handleFile(file);
              }}
              className={cn(
                "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                keoVao
                  ? "border-primary bg-accent/70"
                  : "border-primary/40 bg-accent/30 hover:bg-accent/50",
              )}
            >
              <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
                {laCamTay ? (
                  <Camera className="size-7" />
                ) : (
                  <Upload className="size-7" />
                )}
              </span>
              <span className="text-sm font-medium">
                {laCamTay ? "Chụp ảnh tủ lạnh" : "Tải ảnh tủ lạnh lên"}
              </span>
              <span className="text-muted-foreground text-xs">
                {laCamTay
                  ? "Mở cửa tủ, chụp một tấm thấy rõ các ngăn"
                  : "Kéo thả ảnh vào đây hoặc bấm để chọn file"}
              </span>
            </button>

            {laCamTay && (
              <Button
                variant="ghost"
                className="min-h-11 w-full"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus /> Chọn ảnh có sẵn trong máy
              </Button>
            )}
          </div>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-4/3 w-full">
              <Image
                src={preview}
                alt="Ảnh tủ lạnh vừa chụp"
                fill
                unoptimized
                className="object-cover"
              />
              {loading && (
                <div className="bg-background/70 absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-xs">
                  <Loader2 className="text-primary size-6 animate-spin" />
                  <p className="text-xs font-medium">
                    Đang nhận diện nguyên liệu…
                  </p>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => moNguonAnh()}
              >
                <RefreshCw /> {laCamTay ? "Chụp lại" : "Chọn ảnh khác"}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-xl border p-3">
            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={() => moNguonAnh()}>
                <RefreshCw /> Thử lại
              </Button>
            </div>
          </div>
        )}

        {detected && (
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-primary size-4" />
              <h2 className="text-sm font-semibold">
                Thấy {detected.length} nguyên liệu
              </h2>
              {source === "gemini" && (
                <span className="text-muted-foreground text-[11px]">
                  Gemini
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Bỏ chọn thứ không có, phần thiếu bạn thêm tay ở bước sau.
            </p>

            <div className="space-y-2">
              {detected.map((item) => (
                <Label
                  key={item.id}
                  htmlFor={`d-${item.id}`}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3"
                >
                  <Checkbox
                    id={`d-${item.id}`}
                    checked={picked.has(item.id)}
                    onCheckedChange={(checked) =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(item.id);
                        else next.delete(item.id);
                        return next;
                      })
                    }
                  />
                  <span className="text-xl">{item.emoji}</span>
                  <span className="flex-1 text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </Label>
              ))}
            </div>

            <div className="bg-muted/50 space-y-2 rounded-xl p-3">
              <p className="text-xs font-medium">Thiếu thứ gì thì điền thêm</p>
              <AddIngredient placeholder="vd: đậu phụ, cải chíp…" />
            </div>

            <Button className="w-full" size="lg" onClick={confirm}>
              Xem mâm cơm với {picked.size} nguyên liệu
            </Button>
          </section>
        )}

        {detected && source === "mock" && (
          <p className="text-muted-foreground pb-4 text-center text-[11px]">
            Đang dùng nhận diện mô phỏng. Điền GEMINI_API_KEY vào .env.local để
            đọc ảnh thật.
          </p>
        )}
      </div>
    </div>
  );
}
