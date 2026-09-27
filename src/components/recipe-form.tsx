"use client";

import * as React from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABEL } from "@/data/dishes";
import { luuCongThuc, type ActionState } from "@/lib/actions/recipe";
import { useCatalog } from "@/lib/catalog-context";
import { capitalize, normalizeText } from "@/lib/text";
import type { Dish, MealSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRONG: ActionState = {};

const EXTRA_MAX_LEN = 40;

const SLOT_LABEL: { value: MealSlot; label: string }[] = [
  { value: "sang", label: "Sáng" },
  { value: "trua", label: "Trưa" },
  { value: "toi", label: "Tối" },
];

const DIFFICULTY_LABEL = ["Rất dễ", "Vừa tay", "Cần chút nghề"];

/** Công thức đang sửa. Không truyền là đang viết mới. */
export type CongThucBanDau = {
  id: string;
  name: string;
  emoji: string;
  summary: string;
  role: Dish["role"];
  slots: MealSlot[];
  minutes: number;
  servings: number;
  difficulty: number;
  core: string[];
  optional: string[];
  extras: string[];
  steps: string[];
  tip?: string;
  isPublic: boolean;
};

/**
 * Ô chọn nguyên liệu theo danh mục. `onExtra` có nghĩa là ô này nhận cả tên nhà
 * tự gõ; không có thì chỉ chọn được thứ máy gợi ý hiểu.
 */
function ChonNguyenLieu({
  label,
  hint,
  name,
  value,
  onChange,
  extras,
  onExtras,
}: {
  label: string;
  hint?: string;
  name: string;
  value: string[];
  onChange: (next: string[]) => void;
  extras?: string[];
  onExtras?: (next: string[]) => void;
}) {
  const { getIngredient, searchIngredients, findIngredientByName } =
    useCatalog();
  const oNhap = React.useRef<HTMLInputElement>(null);
  const [tuKhoa, setTuKhoa] = React.useState("");

  const tuKhoaSach = capitalize(tuKhoa).slice(0, EXTRA_MAX_LEN).trim();
  const goiY = searchIngredients(tuKhoa).filter(
    (item) => !value.includes(item.id),
  );
  const daCo =
    goiY.some(
      (item) => normalizeText(item.name) === normalizeText(tuKhoaSach),
    ) ||
    (extras ?? []).some(
      (item) => normalizeText(item) === normalizeText(tuKhoaSach),
    );

  function them(id: string) {
    if (!value.includes(id)) onChange([...value, id]);
    setTuKhoa("");
    oNhap.current?.focus();
  }

  function themTheoTen(text: string) {
    const ten = capitalize(text).slice(0, EXTRA_MAX_LEN).trim();
    if (!ten) return;

    const known = findIngredientByName(ten);
    if (known) {
      them(known.id);
      return;
    }

    // Không khớp danh mục: giữ nguyên tên, máy gợi ý bỏ qua nhưng người đọc vẫn thấy
    if (!onExtras || !extras) return;
    if (!extras.some((item) => normalizeText(item) === normalizeText(ten))) {
      onExtras([...extras, ten]);
    }
    setTuKhoa("");
    oNhap.current?.focus();
  }

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={`nl-${name}`}>{label}</Label>
        {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
      </div>

      {(value.length > 0 || (extras ?? []).length > 0) && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const item = getIngredient(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(value.filter((x) => x !== id))}
                className="border-primary bg-primary text-primary-foreground flex min-h-9 items-center gap-1 rounded-full border px-3 text-sm active:scale-95"
              >
                <span>{item?.emoji ?? "🥘"}</span>
                <span className="max-w-32 truncate">{item?.name ?? id}</span>
                <X className="size-3.5 opacity-80" />
              </button>
            );
          })}

          {(extras ?? []).map((ten) => (
            <button
              key={ten}
              type="button"
              onClick={() =>
                onExtras?.((extras ?? []).filter((x) => x !== ten))
              }
              className="border-primary bg-primary text-primary-foreground flex min-h-9 items-center gap-1 rounded-full border px-3 text-sm active:scale-95"
            >
              <span>🥘</span>
              <span className="max-w-32 truncate">{ten}</span>
              <X className="size-3.5 opacity-80" />
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          ref={oNhap}
          id={`nl-${name}`}
          value={tuKhoa}
          onChange={(event) => setTuKhoa(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            themTheoTen(tuKhoa);
          }}
          maxLength={EXTRA_MAX_LEN}
          enterKeyHint="done"
          placeholder={
            onExtras
              ? "Gõ tên nguyên liệu"
              : "Gõ tên nguyên liệu trong danh mục"
          }
          className="pl-9"
        />
      </div>

      {tuKhoaSach.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {goiY.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => them(item.id)}
              className="bg-background hover:bg-muted flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm"
            >
              <span>{item.emoji}</span>
              <span className="max-w-32 truncate">{item.name}</span>
            </button>
          ))}

          {onExtras && !daCo && (
            <button
              type="button"
              onClick={() => themTheoTen(tuKhoa)}
              className="border-primary text-primary hover:bg-primary/10 flex min-h-9 items-center gap-1.5 rounded-full border border-dashed px-3 text-sm"
            >
              <Plus className="size-3.5" /> Thêm “{tuKhoaSach}”
            </button>
          )}
        </div>
      )}

      {value.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {(extras ?? []).map((ten) => (
        <input key={ten} type="hidden" name="extras" value={ten} />
      ))}
    </div>
  );
}

function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="bg-muted flex rounded-full p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-9 flex-1 rounded-full px-2 text-[13px] font-medium transition-colors xs:text-sm",
            value === option.value
              ? "bg-background shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function RecipeForm({ congThuc }: { congThuc?: CongThucBanDau }) {
  const [state, formAction, pending] = React.useActionState(luuCongThuc, TRONG);

  const [role, setRole] = React.useState<Dish["role"]>(congThuc?.role ?? "man");
  const [slots, setSlots] = React.useState<MealSlot[]>(
    congThuc?.slots ?? ["trua", "toi"],
  );
  const [difficulty, setDifficulty] = React.useState(congThuc?.difficulty ?? 1);
  const [core, setCore] = React.useState<string[]>(congThuc?.core ?? []);
  const [optional, setOptional] = React.useState<string[]>(
    congThuc?.optional ?? [],
  );
  const [extras, setExtras] = React.useState<string[]>(congThuc?.extras ?? []);
  const [isPublic, setIsPublic] = React.useState(congThuc?.isPublic ?? false);

  return (
    <form action={formAction} className="space-y-5">
      {congThuc && <input type="hidden" name="id" value={congThuc.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Tên món</Label>
        <div className="flex gap-2">
          <Input
            name="emoji"
            defaultValue={congThuc?.emoji ?? "🍲"}
            maxLength={4}
            aria-label="Biểu tượng món"
            className="w-14 text-center text-lg"
          />
          <Input
            id="name"
            name="name"
            defaultValue={congThuc?.name}
            maxLength={120}
            required
            placeholder="Thịt kho tàu kiểu nhà mình"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Giới thiệu một câu</Label>
        <Input
          id="summary"
          name="summary"
          defaultValue={congThuc?.summary}
          maxLength={280}
          placeholder="Kho với nước dừa, để qua đêm càng ngon"
        />
      </div>

      <div className="space-y-2">
        <Label>Món này là</Label>
        <PillGroup
          options={(Object.keys(ROLE_LABEL) as Dish["role"][]).map((value) => ({
            value,
            label: ROLE_LABEL[value],
          }))}
          value={role}
          onChange={setRole}
        />
        <input type="hidden" name="role" value={role} />
      </div>

      <div className="space-y-2">
        <Label>Hay nấu vào bữa</Label>
        <div className="flex gap-2">
          {SLOT_LABEL.map((slot) => {
            const chon = slots.includes(slot.value);
            return (
              <button
                key={slot.value}
                type="button"
                aria-pressed={chon}
                onClick={() =>
                  setSlots((cu) =>
                    cu.includes(slot.value)
                      ? cu.filter((value) => value !== slot.value)
                      : [...cu, slot.value],
                  )
                }
                className={cn(
                  "min-h-9 flex-1 rounded-full border text-sm font-medium transition-colors active:scale-95",
                  chon
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
        {slots.map((slot) => (
          <input key={slot} type="hidden" name="slots" value={slot} />
        ))}
      </div>

      <ChonNguyenLieu
        label="Nguyên liệu chính"
        hint="Thiếu thứ này là phải đi chợ. Máy gợi ý chấm điểm theo đây."
        name="core"
        value={core}
        onChange={setCore}
        extras={extras}
        onExtras={setExtras}
      />

      <ChonNguyenLieu
        label="Có thì ngon hơn"
        hint="Không có vẫn nấu được."
        name="optional"
        value={optional}
        onChange={setOptional}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minutes">Nấu bao lâu (phút)</Label>
          <Input
            id="minutes"
            name="minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            defaultValue={congThuc?.minutes ?? 30}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings">Mấy người ăn</Label>
          <Input
            id="servings"
            name="servings"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            defaultValue={congThuc?.servings ?? 4}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Độ khó</Label>
        <PillGroup
          options={DIFFICULTY_LABEL.map((label, index) => ({
            value: index + 1,
            label,
          }))}
          value={difficulty}
          onChange={setDifficulty}
        />
        <input type="hidden" name="difficulty" value={difficulty} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps">Các bước</Label>
        <p className="text-muted-foreground text-xs">Mỗi dòng là một bước.</p>
        <Textarea
          id="steps"
          name="steps"
          rows={8}
          defaultValue={congThuc?.steps.join("\n")}
          placeholder={"Ướp thịt với hành tỏi 15 phút\nThắng nước màu\n..."}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tip">Mẹo nhỏ</Label>
        <Textarea
          id="tip"
          name="tip"
          rows={2}
          maxLength={500}
          defaultValue={congThuc?.tip}
          placeholder="Kho lửa nhỏ, đừng đậy vung kín kẻo thịt bị chua"
        />
      </div>

      <button
        type="button"
        onClick={() => setIsPublic((cu) => !cu)}
        aria-pressed={isPublic}
        className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-xl border p-3 text-left"
      >
        <span
          className={cn(
            "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
            isPublic ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "bg-background size-5 rounded-full shadow transition-transform",
              isPublic && "translate-x-5",
            )}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Cho người khác xem</span>
          <span className="text-muted-foreground block text-xs">
            {isPublic
              ? "Ai có link cũng đọc được công thức này."
              : "Chỉ nhà mình thấy."}
          </span>
        </span>
      </button>
      {isPublic && <input type="hidden" name="isPublic" value="on" />}

      {state.error && (
        <p className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {congThuc ? "Lưu thay đổi" : "Lưu công thức"}
      </Button>
    </form>
  );
}
