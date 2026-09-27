import { normalizeText } from "@/lib/text";
import type {
  ChatResponse,
  ChatTurn,
  DishProposal,
  PrefsProposal,
} from "@/lib/chat-api";
import type { ChatScope, Dish, HouseholdPrefs, Ingredient } from "@/lib/types";

/**
 * Trả lời sẵn cho trợ lý bếp khi chưa cấu hình Vertex (hoặc Vertex hỏng).
 *
 * Không phải để thay Gemini: để mọi luồng phía sau trợ lý - đề xuất chỉnh món,
 * bấm đồng ý, ghi ràng buộc cả nhà, chọn món cho mâm cơm - bấm thử được mà
 * không tốn quota và không cần mạng. Mọi id trả ra đều lấy từ danh mục thật
 * nên rào chắn ở route không có gì để loại.
 */

type BepCatalog = { ingredients: Ingredient[]; dishes: Dish[] };

type MockInput = {
  scope: ChatScope;
  messages: ChatTurn[];
  dish?: Dish;
  pantry?: string[];
  prefs?: HouseholdPrefs;
};

const THAY_CHO_THIT = ["dau-hu", "nam-rom"];

const LA_DAM = (id: string) =>
  id.startsWith("thit") ||
  id.startsWith("ca-") ||
  [
    "tom",
    "dui-ga",
    "suon-non",
    "ca-basa",
    "ca-loc",
    "muc",
    "trung-ga",
  ].includes(id);

function cauCuoiCuaNguoiDung(messages: ChatTurn[]): string {
  const cuoi = [...messages].reverse().find((m) => m.role === "user");
  return normalizeText(cuoi?.content ?? "");
}

function chua(cau: string, ...tuKhoa: string[]): boolean {
  return tuKhoa.some((tu) => cau.includes(normalizeText(tu)));
}

/** Nguyên liệu trong danh mục mà câu hỏi có nhắc tên (kể cả tên gọi khác). */
function nguyenLieuTrongCau(
  cau: string,
  ingredients: Ingredient[],
): Ingredient[] {
  return ingredients.filter((item) =>
    [item.name, ...(item.aliases ?? [])].some((ten) => {
      const sach = normalizeText(ten);
      return sach.length >= 3 && cau.includes(sach);
    }),
  );
}

function tenCua(ids: string[], ingredients: Ingredient[]): string {
  const map = new Map(ingredients.map((i) => [i.id, i.name]));
  return ids.map((id) => map.get(id) ?? id).join(", ");
}

/** Món nấu được nhất với những gì đang có trong tủ, mỗi vai trò một món. */
function monHopTu(catalog: BepCatalog, pantry: string[]): string[] {
  const co = new Set(pantry);
  const staple = new Set(
    catalog.ingredients.filter((i) => i.staple).map((i) => i.id),
  );

  const chamDiem = (dish: Dish) => {
    const can = dish.core.filter((id) => !staple.has(id));
    if (can.length === 0) return 0;
    return can.filter((id) => co.has(id)).length / can.length;
  };

  const daChon: string[] = [];
  for (const vai of ["man", "canh", "rau"] as const) {
    const tot = catalog.dishes
      .filter((d) => d.role === vai)
      .sort((a, b) => chamDiem(b) - chamDiem(a))[0];
    if (tot) daChon.push(tot.id);
  }
  return daChon;
}

function chinhMon(
  cau: string,
  dish: Dish,
  ingredients: Ingredient[],
): DishProposal | undefined {
  const coTrongDanhMuc = new Set(ingredients.map((i) => i.id));

  if (chua(cau, "chay", "khong thit", "an chay", "ko thit")) {
    const thayThe = THAY_CHO_THIT.filter((id) => coTrongDanhMuc.has(id));
    const giuLai = dish.core.filter((id) => !LA_DAM(id));
    const core = Array.from(new Set([...giuLai, ...thayThe]));

    return {
      note: "Đổi sang bản chay: bỏ phần đạm động vật, thay bằng đậu hũ và nấm",
      name: `${dish.name} chay`,
      summary: "Bản chay, vẫn giữ cách nêm và thứ tự nấu như món gốc.",
      core,
      steps: [
        "Đậu hũ cắt miếng vừa ăn, áp chảo vàng hai mặt rồi để riêng",
        "Nấm rơm chẻ đôi, rửa nhanh, để ráo",
        ...dish.steps.slice(1),
        "Cho đậu hũ vào sau cùng, đảo nhẹ tay kẻo nát",
      ].slice(0, 10),
      tip: "Không có nước mắm thì nêm nước tương, vị vẫn đậm.",
    };
  }

  if (chua(cau, "nhanh", "gap", "voi", "it thoi gian", "20 phut", "30 phut")) {
    return {
      note: "Rút gọn để kịp bữa: bỏ bước ướp lâu, nấu lửa lớn hơn",
      minutes: Math.max(10, dish.minutes - 12),
      steps: [
        "Ướp nhanh 5 phút trong lúc bắc chảo, không cần để 30 phút",
        ...dish.steps.slice(1, 5),
      ],
      tip: "Thái nhỏ hơn bình thường một chút thì chín nhanh hơn hẳn.",
    };
  }

  if (chua(cau, "cay", "them ot")) {
    const ot = coTrongDanhMuc.has("ot") ? ["ot"] : [];
    return {
      note: "Thêm ớt cho cay hơn",
      optional: Array.from(new Set([...dish.optional, ...ot])),
      tip: "Cho ớt lúc gần tắt bếp thì thơm mà không bị đắng.",
    };
  }

  if (chua(cau, "tre con", "cho be", "em be", "con nho", "tre nho")) {
    return {
      note: "Chỉnh cho trẻ nhỏ ăn được: nhạt hơn, bỏ cay",
      summary: "Bản cho nhà có trẻ nhỏ: nêm nhạt, không ớt, miếng cắt nhỏ.",
      optional: dish.optional.filter((id) => id !== "ot"),
      tip: "Nêm nhạt hơn bình thường một phần ba, người lớn thêm mắm ớt sau.",
    };
  }

  if (chua(cau, "man qua", "nhat", "it man", "giam man")) {
    return {
      note: "Nêm nhạt lại",
      tip: "Lỡ mặn thì thêm nước và một củ khoai tây cắt lát, đun 10 phút rồi vớt ra.",
    };
  }

  // "nhà hết cà chua rồi" - bỏ đúng nguyên liệu đó khỏi phần chính
  if (chua(cau, "het", "khong co", "ko co", "thieu")) {
    const nhacToi = nguyenLieuTrongCau(cau, ingredients).filter((item) =>
      dish.core.includes(item.id),
    );
    if (nhacToi.length > 0) {
      const boDi = new Set(nhacToi.map((i) => i.id));
      return {
        note: `Bỏ ${nhacToi.map((i) => i.name).join(", ")} khỏi nguyên liệu chính`,
        core: dish.core.filter((id) => !boDi.has(id)),
        tip: `Thiếu ${nhacToi[0].name} thì món nhạt màu hơn chút, nêm đậm tay hơn là ổn.`,
      };
    }
  }

  return undefined;
}

function chinhCaNha(
  cau: string,
  ingredients: Ingredient[],
): PrefsProposal | undefined {
  if (
    chua(cau, "di ung", "khong an duoc", "ko an duoc", "kieng", "khong thich")
  ) {
    const nhacToi = nguyenLieuTrongCau(cau, ingredients);
    if (nhacToi.length > 0) {
      return {
        avoid: nhacToi.map((i) => i.id),
        notes: [`Nhà không ăn ${nhacToi.map((i) => i.name).join(", ")}`],
      };
    }
  }

  if (chua(cau, "an chay", "thu hai chay", "ngay ram")) {
    return { avoid: [], notes: ["Nhà ăn chay ngày rằm và mùng một"] };
  }

  if (chua(cau, "tre con", "co be", "con nho")) {
    return { avoid: [], notes: ["Nhà có trẻ nhỏ, nấu nhạt và không cay"] };
  }

  return undefined;
}

/**
 * `hasGemini` chỉ đổi câu mở đầu: chưa cắm key là một chuyện, cắm rồi mà
 * Gemini hỏng lại là chuyện khác, người dùng cần phân biệt được.
 */
export function traLoiMoPhong(
  input: MockInput,
  catalog: BepCatalog,
  hasGemini: boolean,
): ChatResponse {
  const cau = cauCuoiCuaNguoiDung(input.messages);
  const dauCau = hasGemini
    ? "Trợ lý đang bận nên mình trả lời tạm bằng bản mẫu."
    : "Đang chạy bản mẫu (chưa cấu hình Vertex AI).";

  if (input.scope === "dish" && input.dish) {
    const dish = input.dish;
    const dishProposal = chinhMon(cau, dish, catalog.ingredients);

    if (dishProposal) {
      return {
        source: "mock",
        reply: `${dauCau} Mình chỉnh thử ${dish.name} thế này: ${dishProposal.note.toLowerCase()}. Xem rồi bấm đồng ý nếu hợp nhé.`,
        dishProposal,
      };
    }

    const thieu = dish.core.filter((id) => !(input.pantry ?? []).includes(id));
    const nhac =
      thieu.length > 0
        ? ` Tủ nhà mình đang thiếu ${tenCua(thieu.slice(0, 3), catalog.ingredients)}.`
        : " Đồ trong tủ đủ để nấu món này rồi.";

    return {
      source: "mock",
      reply: `${dauCau}${nhac} Thử hỏi "làm chay đi", "nhà hết cà chua rồi" hay "nấu nhanh giúp mình" để xem trợ lý đề xuất chỉnh món.`,
    };
  }

  const prefsProposal = chinhCaNha(cau, catalog.ingredients);
  if (prefsProposal) {
    return {
      source: "mock",
      reply: `${dauCau} Mình ghi lại: ${prefsProposal.notes.join("; ")}. Từ giờ gợi ý sẽ tránh chỗ đó.`,
      prefsProposal,
    };
  }

  const picked = monHopTu(catalog, input.pantry ?? []);
  const tenMon = picked
    .map((id) => catalog.dishes.find((d) => d.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  return {
    source: "mock",
    reply: picked.length
      ? `${dauCau} Với đồ đang có, mâm gọn nhất là: ${tenMon}. Muốn đổi thì nói "nhà dị ứng tôm" hoặc "hôm nay ăn chay".`
      : `${dauCau} Chưa có nguyên liệu nào trong tủ nên mình chưa gợi ý được, thêm vài thứ vào tủ lạnh đã nhé.`,
    pickedDishIds: picked.length ? picked : undefined,
  };
}
