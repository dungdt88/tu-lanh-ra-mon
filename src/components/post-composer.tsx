"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dangBai, type ActionState } from "@/lib/actions/post";
import { useCatalog } from "@/lib/catalog-context";
import { nenAnh } from "@/lib/image";
import { TU_DO_MAX_LEN, danhDauTuDo } from "@/lib/ingredient-id";
import { usePantry } from "@/lib/pantry-store";
import { capitalize, normalizeText } from "@/lib/text";
import type { Dish } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRONG: ActionState = {};

/**
 * Một lựa chọn trong phần "Nấu bằng gì?". Có `id` nghĩa là nguyên liệu nằm
 * trong danh mục nên gửi lên theo id; `id` null là tên nhà mình tự gõ, gửi lên
 * theo tên.
 */
type ChipNguyenLieu = {
  key: string;
  ten: string;
  emoji: string;
  id: string | null;
};

/** `monBanDau` là id món chọn sẵn, dùng khi bấm "khoe món này" từ công thức. */
export function PostComposer({ monBanDau }: { monBanDau?: string }) {
  const { dishes, getIngredient, searchIngredients, findIngredientByName } =
    useCatalog();
  const { items, customMap } = usePantry();
  const [state, formAction, pending] = React.useActionState(dangBai, TRONG);

  const monChonSan = monBanDau
    ? (dishes.find((item) => item.id === monBanDau) ?? null)
    : null;

  const [dish, setDish] = React.useState<Dish | null>(monChonSan);
  const [tuKhoa, setTuKhoa] = React.useState("");
  const [tenMonTuDo, setTenMonTuDo] = React.useState("");
  const [nguyenLieu, setNguyenLieu] = React.useState<string[]>(() =>
    monChonSan
      ? monChonSan.core.filter((id) => !getIngredient(id)?.staple)
      : [],
  );
  const [themTay, setThemTay] = React.useState<ChipNguyenLieu[]>([]);
  const [timNguyenLieu, setTimNguyenLieu] = React.useState("");
  const oTimNguyenLieu = React.useRef<HTMLInputElement>(null);
  const [anh, setAnh] = React.useState<File | null>(null);
  const [xemTruoc, setXemTruoc] = React.useState<string | null>(null);
  const [dangNen, setDangNen] = React.useState(false);

  const goiY = React.useMemo(() => {
    const q = normalizeText(tuKhoa);
    if (!q) return [];
    return dishes
      .filter((item) => normalizeText(item.name).includes(q))
      .slice(0, 6);
  }, [dishes, tuKhoa]);

  // Chip sẵn có: nguyên liệu của món vừa chọn + những gì đang có trong tủ lạnh.
  const chipGoiY = React.useMemo<ChipNguyenLieu[]>(() => {
    const tuMon = dish ? [...dish.core, ...dish.optional] : [];
    const ra: ChipNguyenLieu[] = [];

    for (const id of new Set([...tuMon, ...items])) {
      const item = getIngredient(id);
      if (item) {
        // Gia vị nền (mắm, muối, dầu ăn) nhà nào cũng có, không cần khoe
        if (!item.staple) {
          ra.push({ key: id, ten: item.name, emoji: item.emoji, id });
        }
        continue;
      }

      // Nguyên liệu tự điền trong tủ lạnh: không có trong danh mục nên đi
      // theo tên chứ không theo id.
      const tuDien = customMap.get(id);
      if (tuDien) {
        ra.push({
          key: danhDauTuDo(tuDien.name),
          ten: tuDien.name,
          emoji: tuDien.emoji,
          id: null,
        });
      }
    }

    return ra;
  }, [dish, items, customMap, getIngredient]);

  const chips = React.useMemo(() => {
    const map = new Map<string, ChipNguyenLieu>();
    for (const chip of [...chipGoiY, ...themTay]) map.set(chip.key, chip);
    return Array.from(map.values());
  }, [chipGoiY, themTay]);

  const timSach = capitalize(timNguyenLieu).slice(0, TU_DO_MAX_LEN).trim();

  const goiYNguyenLieu = React.useMemo(
    () =>
      searchIngredients(timNguyenLieu).filter(
        (item) => !nguyenLieu.includes(item.id),
      ),
    [searchIngredients, timNguyenLieu, nguyenLieu],
  );

  // Gõ trúng tên đã có sẵn thì không cần nút "Thêm ..." nữa
  const daCoTen =
    chips.some((chip) => normalizeText(chip.ten) === normalizeText(timSach)) ||
    goiYNguyenLieu.some(
      (item) => normalizeText(item.name) === normalizeText(timSach),
    );

  function doiChon(key: string) {
    setNguyenLieu((cu) =>
      cu.includes(key) ? cu.filter((value) => value !== key) : [...cu, key],
    );
  }

  function themChip(chip: ChipNguyenLieu) {
    setThemTay((cu) =>
      cu.some((item) => item.key === chip.key) ? cu : [...cu, chip],
    );
    setNguyenLieu((cu) => (cu.includes(chip.key) ? cu : [...cu, chip.key]));
    setTimNguyenLieu("");
    // Thêm xong con trỏ ở lại ô nhập để gõ tiếp nguyên liệu sau
    oTimNguyenLieu.current?.focus();
  }

  /**
   * Gõ tên tự do: khớp danh mục (kể cả tên gọi khác) thì lấy đúng nguyên liệu
   * đó, không khớp thì giữ nguyên tên nhà mình gõ.
   */
  function themTheoTen(text: string) {
    const ten = capitalize(text).slice(0, TU_DO_MAX_LEN).trim();
    if (!ten) return;

    const known = findIngredientByName(ten);
    themChip(
      known
        ? { key: known.id, ten: known.name, emoji: known.emoji, id: known.id }
        : { key: danhDauTuDo(ten), ten, emoji: "🥘", id: null },
    );
  }

  function chonMon(item: Dish) {
    setDish(item);
    setTuKhoa("");
    setTenMonTuDo("");
    // Đổi món thì lấy lại nguyên liệu của món mới, nhưng giữ những thứ người
    // dùng đã tự thêm tay.
    const giuLai = nguyenLieu.filter((key) =>
      themTay.some((chip) => chip.key === key),
    );
    setNguyenLieu(
      Array.from(
        new Set([
          ...item.core.filter((id) => !getIngredient(id)?.staple),
          ...giuLai,
        ]),
      ),
    );
  }

  async function chonAnh(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setDangNen(true);
    const nen = await nenAnh(file);
    setDangNen(false);

    setAnh(nen);
    setXemTruoc((cu) => {
      if (cu) URL.revokeObjectURL(cu);
      return URL.createObjectURL(nen);
    });
  }

  function boAnh() {
    setAnh(null);
    setXemTruoc((cu) => {
      if (cu) URL.revokeObjectURL(cu);
      return null;
    });
  }

  // Ảnh gửi lên là bản đã nén, không phải file gốc trong input.
  function guiBai(formData: FormData) {
    formData.delete("anh");
    if (anh) formData.set("anh", anh, anh.name);
    formAction(formData);
  }

  const tenMon = dish?.name ?? tenMonTuDo;

  return (
    <form action={guiBai} className="space-y-5">
      <div className="space-y-2">
        <Label>Ảnh món ăn</Label>
        {xemTruoc ? (
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src={xemTruoc}
              alt="Ảnh vừa chọn"
              width={800}
              height={600}
              unoptimized
              className="h-auto w-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={boAnh}
              aria-label="Bỏ ảnh"
              className="absolute top-2 right-2"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <label className="border-input hover:bg-muted/60 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center transition-colors">
            {dangNen ? (
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            ) : (
              <Camera className="text-muted-foreground size-6" />
            )}
            <span className="text-muted-foreground text-sm">
              {dangNen ? "Đang xử lý ảnh..." : "Chụp hoặc chọn ảnh mâm cơm"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={chonAnh}
            />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mon">Món gì?</Label>
        {dish ? (
          <div className="bg-accent/50 flex items-center gap-3 rounded-xl p-3">
            <span className="text-2xl">{dish.emoji}</span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {dish.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDish(null);
                setNguyenLieu((cu) =>
                  cu.filter((key) => themTay.some((chip) => chip.key === key)),
                );
              }}
            >
              Đổi
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="mon"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm trong danh mục: thịt kho, canh chua..."
                className="pl-9"
              />
            </div>

            {goiY.length > 0 && (
              <ul className="divide-y rounded-xl border">
                {goiY.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => chonMon(item)}
                      className="hover:bg-muted flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm"
                    >
                      <span>{item.emoji}</span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Input
              name="dishName"
              value={tenMonTuDo}
              onChange={(e) => setTenMonTuDo(e.target.value)}
              maxLength={120}
              placeholder="Hoặc gõ tên món nhà mình tự đặt"
            />
          </>
        )}
        {dish && <input type="hidden" name="dishId" value={dish.id} />}
      </div>

      <div className="space-y-2">
        <Label htmlFor="them-nguyen-lieu">Nấu bằng gì?</Label>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const dangChon = nguyenLieu.includes(chip.key);
              return (
                <button
                  key={chip.key}
                  type="button"
                  aria-pressed={dangChon}
                  onClick={() => doiChon(chip.key)}
                  className={cn(
                    "flex min-h-9 items-center gap-1 rounded-full border px-3 text-sm transition-colors active:scale-95",
                    dangChon
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <span>{chip.emoji}</span>
                  <span className="max-w-32 truncate">{chip.ten}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={oTimNguyenLieu}
            id="them-nguyen-lieu"
            value={timNguyenLieu}
            onChange={(e) => setTimNguyenLieu(e.target.value)}
            onKeyDown={(event) => {
              // Enter trong form này mặc định là đăng bài, nên chặn lại
              if (event.key !== "Enter") return;
              event.preventDefault();
              themTheoTen(timNguyenLieu);
            }}
            maxLength={TU_DO_MAX_LEN}
            enterKeyHint="done"
            placeholder="Thêm nguyên liệu: gõ tên gì cũng được"
            className="pl-9"
          />
        </div>

        {timSach.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goiYNguyenLieu.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  themChip({
                    key: item.id,
                    ten: item.name,
                    emoji: item.emoji,
                    id: item.id,
                  })
                }
                className="bg-background hover:bg-muted flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm"
              >
                <span>{item.emoji}</span>
                <span className="max-w-32 truncate">{item.name}</span>
              </button>
            ))}

            {!daCoTen && (
              <button
                type="button"
                onClick={() => themTheoTen(timNguyenLieu)}
                className="border-primary text-primary hover:bg-primary/10 flex min-h-9 items-center gap-1.5 rounded-full border border-dashed px-3 text-sm"
              >
                <Plus className="size-3.5" /> Thêm “{timSach}”
              </button>
            )}
          </div>
        )}

        {nguyenLieu.map((key) => {
          const chip = chips.find((item) => item.key === key);
          if (!chip) return null;
          return chip.id ? (
            <input
              key={key}
              type="hidden"
              name="ingredientIds"
              value={chip.id}
            />
          ) : (
            <input
              key={key}
              type="hidden"
              name="ingredientNames"
              value={chip.ten}
            />
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">Kể vài câu</Label>
        <Textarea
          id="caption"
          name="caption"
          rows={4}
          maxLength={2000}
          placeholder="Hôm nay tan làm muộn, tủ còn mỗi..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="minutes">Nấu hết bao lâu? (phút)</Label>
        <Input
          id="minutes"
          name="minutes"
          key={dish?.id ?? "mon-tu-do"}
          type="number"
          inputMode="numeric"
          min={1}
          max={1440}
          defaultValue={dish?.minutes}
          placeholder="30"
        />
      </div>

      {state.error && (
        <p className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending || dangNen || !tenMon.trim()}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Đăng lên cộng đồng
      </Button>
    </form>
  );
}
