# Quy ước & chuẩn code — Tủ Lạnh Ra Món

`AGENTS.md` là bản tóm tắt cho agent đọc trước khi sửa code. Tài liệu này là bản
đầy đủ: **vì sao** mỗi quy ước tồn tại, để người đọc biết khi nào được phá lệ.

---

## 1. Ngôn ngữ

| Chỗ | Ngôn ngữ |
| --- | --- |
| Định danh trong code (biến, hàm, type, tên file) | tiếng Anh |
| Comment và TSDoc | **tiếng Việt** |
| Chuỗi hiển thị cho người dùng | tiếng Việt |
| Commit message | tiếng Việt không dấu |
| id nguyên liệu và id món | tiếng Việt **không dấu**, kebab-case |

Trộn hai ngôn ngữ nghe thì kỳ, nhưng có lý do: định danh tiếng Anh để hợp với thư
viện và công cụ, còn giải thích thì viết bằng thứ tiếng người bảo trì nghĩ bằng nó.

Ngoại lệ: tên hàm mô tả nghiệp vụ thuần Việt được đặt tiếng Việt không dấu khi
tiếng Anh làm mờ nghĩa — `slotTheoGio()`, `laBuaSang`, `xemGoiY()` trong
`src/app/page.tsx`. Đừng lạm dụng; mặc định vẫn là tiếng Anh.

**id là dữ liệu, không phải chữ hiển thị.** `thit-ba-chi`, `rau-muong`,
`bua-sang` — không dấu, kebab-case, không bao giờ đổi sau khi đã phát hành, vì
người dùng đã lưu chúng trong `localStorage` và trong `pantry_items` trên DB.
Đổi tên hiển thị thì tự do; đổi id là một cuộc di trú dữ liệu.

---

## 2. Định dạng và lint

Không có file cấu hình Prettier → chạy **mặc định của Prettier**: nháy kép, chấm
phẩy, thụt 2 khoảng trắng, xuống dòng ở 80 ký tự, dấu phẩy cuối.

```bash
npm run format        # sửa
npm run format:check  # chỉ kiểm tra
npm run lint          # eslint: next core-web-vitals + typescript
npm run typecheck     # tsc --noEmit
```

Đừng tranh luận về định dạng — cứ chạy `npm run format`.

> Hiện `npm run format:check` đang báo `src/data/dishes.ts` lệch định dạng. Đây
> là nợ có sẵn, không phải quy ước mới. Chạy `npm run format` khi nào tiện.

---

## 3. TypeScript

- **`type`, không `interface`.** Cả repo dùng `type`; `interface` chỉ cần khi
  muốn khai báo chồng, mà ở đây không có nhu cầu đó.
- **`import type`** cho mọi import chỉ dùng làm kiểu. Giúp bundler loại bỏ sạch.
- **Không `any`.** Dữ liệu từ ngoài vào (Gemini, `request.json()`) khai là
  `unknown` rồi thu hẹp dần bằng kiểm tra thật — xem `keepKnown()` và
  `cleanStrings()` trong `src/app/api/chat/route.ts`.
- **`satisfies` khi trả response API**: `return NextResponse.json({...} satisfies ChatResponse)`.
  Kiểm tra được hình dạng mà không làm rộng kiểu ra.
- **Union chuỗi thay cho enum**: `"sang" | "trua" | "toi"`. Chúng khớp trực tiếp
  với enum Postgres và serialize thẳng ra JSON.
- `@/` là alias tới `src/`. Dùng nó, đừng viết `../../lib/types`.

Mọi kiểu dùng chung nằm ở `src/lib/types.ts`. Kiểu chỉ một module dùng thì để tại
chỗ (`RankOptions` trong `suggest.ts`, `CustomIngredient` trong `pantry-store.tsx`).

---

## 4. Đặt tên

| Thứ | Quy ước | Ví dụ |
| --- | --- | --- |
| File | kebab-case | `meal-plan-card.tsx`, `dish-override.ts` |
| Component | PascalCase | `MealPlanCard`, `BottomNav` |
| Hàm, biến | camelCase | `buildMealPlans`, `staples` |
| Type | PascalCase | `DishMatch`, `HouseholdPrefs` |
| Hằng module | SCREAMING_SNAKE | `DISHES`, `MAX_MESSAGES`, `STORAGE_KEY` |
| Khoá localStorage | `tlrm.<tên>.v<n>` | `tlrm.pantry.v1` |

Khoá localStorage **có số phiên bản**. Đổi hình dạng dữ liệu lưu thì tăng số,
đừng đọc đè lên khoá cũ — máy người dùng vẫn còn dữ liệu cũ và `JSON.parse` sẽ
cho ra thứ không đúng kiểu mà TypeScript không hề biết.

---

## 5. Ranh giới server / client

Đây là quy ước dễ vi phạm nhất và hậu quả nặng nhất: rò key ra bundle trình duyệt.

- **Module chạm bí mật phải mở đầu bằng `import "server-only"`.** Đang áp dụng ở
  `src/lib/gemini.ts`, `src/lib/gemini-chat.ts`, `src/lib/repo/catalog.ts`. Nếu
  vô tình import chúng từ component client, build sẽ **fail** — đó chính là điều
  ta muốn.
- Chỉ biến `NEXT_PUBLIC_*` được đọc ở client. Khoá service account Google Cloud và
  `SUPABASE_SERVICE_ROLE_KEY` không bao giờ.
- Đọc env tập trung một chỗ (`src/lib/supabase/env.ts`, phần đầu
  `src/lib/gemini.ts`), không rải `process.env` khắp component.
- `"use client"` chỉ đặt ở component thật sự cần state, hiệu ứng, hoặc trình xử
  lý sự kiện. `page-header.tsx` cố tình **không** có — nó thuần hiển thị.
- `layout.tsx` là server component `async`: nó gọi `getCatalog()` một lần rồi
  truyền danh mục xuống qua `CatalogProvider`. Nhờ vậy mỗi trang không phải tự đi
  lấy danh mục.

---

## 6. State

Ba tầng, mỗi tầng một việc:

| Tầng | Cách làm | Dùng cho |
| --- | --- | --- |
| Dữ liệu server | `getCatalog()` trong `layout.tsx` → `CatalogProvider` | danh mục món và nguyên liệu |
| Trạng thái chung toàn app | `useSyncExternalStore` + `localStorage` | tủ lạnh (`pantry-store`), trợ lý (`chat-store`) |
| Trạng thái của một màn | `React.useState` | tab đang chọn, đang mở/đóng |

**Không có Redux, Zustand hay Jotai, và đừng thêm.** Store viết tay bằng
`useSyncExternalStore` chỉ khoảng 140 dòng, không phụ thuộc gì, và cho ta kiểm
soát chính xác thời điểm hydrate — thứ quan trọng vì dữ liệu nằm ở `localStorage`
mà server không đọc được.

### Bẫy hydrate — đọc kỹ

Server không có `localStorage`, cũng không biết mấy giờ ở máy người dùng. Render
thẳng những thứ đó sẽ lệch nội dung giữa server và client.

Ba khuôn mẫu đang dùng, hãy theo đúng:

1. **`hydrated`** — store trả cờ này; trước khi nó bật, dùng giá trị rỗng.
   `bottom-nav.tsx` chỉ hiện badge đếm khi `hydrated && items.length > 0`.
2. **`useMounted()`** — cho thứ phụ thuộc thời gian.
   `page.tsx` mặc định bữa trưa cho tới khi `mounted`, rồi mới suy ra bữa theo giờ thật.
3. **Cờ hydrate của store khác** — `page.tsx` chờ `chatHydrated` rồi mới áp
   override và bộ lọc tránh nguyên liệu, nếu không lần render đầu sẽ khác lần sau.

Mọi hàm ghi vào store **đọc `snapshot` mới nhất**, không dùng biến của lần render
hiện tại. Nhờ vậy gọi `add()` rồi `addCustom()` liên tiếp trong cùng một sự kiện
không ghi đè lẫn nhau. Giữ nguyên tính chất này khi thêm hàm mới.

Ghi `localStorage` luôn bọc `try/catch` — chế độ riêng tư có thể chặn, và app vẫn
phải chạy được trong phiên đó.

---

## 7. Route API

Hai route: `POST /api/recognize` và `POST /api/chat`. Cả hai theo cùng một khuôn:

```
1. Xác thực đầu vào  → 400 kèm thông báo tiếng Việt nếu hỏng
2. Lấy danh mục thật → getCatalog()
3. Có key?           → gọi Gemini trong try/catch
4. Lọc kết quả AI    → đối chiếu mọi id với danh mục
5. catch / không key → trả bản mô phỏng, KHÔNG phải lỗi
```

**Bước 4 là rào chắn quan trọng nhất của toàn dự án.** Xem mục 4 của
`business-requirements.md`.

**Bước 5 là một cam kết sản phẩm**: app không bao giờ hiện màn lỗi vì AI. Hỏng
thì lùi về bản mô phỏng và nói thật với người dùng. Response luôn có trường
`source: "gemini" | "mock"` để UI nói rõ đang dùng bản nào.

Giới hạn đầu vào khai thành hằng ở đầu file (`MAX_MESSAGES = 10`,
`MAX_LEN = 2000`), không rải số ma giữa thân hàm. Gọi Gemini luôn có
`AbortSignal.timeout(30_000)`.

---

## 8. Dữ liệu và migration

- **Mọi bảng nằm trong schema `tlrm`, không phải `public`.** Tên schema khai một
  chỗ duy nhất: `DB_SCHEMA` trong `src/lib/supabase/env.ts`. Client, seed script và
  `check-db` đều đọc từ đó — đừng viết `"tlrm"` thẳng vào chỗ thứ hai.
- Schema tự tạo **không** được Supabase cấp quyền sẵn như `public`. Bảng mới phải
  `grant` tay, và schema phải nằm trong Settings → API → Exposed schemas thì
  PostgREST mới thấy. Xem `docs/supabase-setup.md`.
- `src/data/*.ts` là nguồn sự thật cho danh mục. `supabase/seed.sql` **sinh ra
  từ đó** bằng `npm run seed:gen` — đừng sửa `seed.sql` bằng tay.
- `npm run seed:gen` **kiểm tra dữ liệu trước khi ghi**: mọi id trong `core` /
  `optional` phải có thật trong `INGREDIENTS`, và mọi id phải đúng kebab-case.
  Sai thì thoát với mã 1 và không ghi file. Lý do: `src/data` không có khoá ngoại
  còn DB thì có, nên một id gõ sai chỉ làm món "thiếu nguyên liệu" một cách im
  lặng ở bản mock, tới lúc đổ seed mới nổ.
- `src/lib/repo/catalog.ts` quyết định lấy dữ liệu từ đâu: có đủ env Supabase thì
  đọc DB, không thì dùng `src/data`. Phần còn lại của app không biết và không cần
  biết.
- Migration đánh số tăng dần, không bao giờ sửa file đã chạy:
  `0001_init.sql`, `0002_bua_sang.sql`.
- Bảng mới đụng dữ liệu người dùng **phải bật RLS và có policy `auth.uid() = user_id`**.
  Đây là điều kiện bắt buộc, không phải tuỳ chọn — `anon key` nằm trong bundle
  trình duyệt, RLS là thứ duy nhất chặn người này đọc tủ lạnh của người kia.
- Bảng danh mục (`ingredients`, `dishes`, `dish_ingredients`) cho `anon` đọc,
  **không tạo policy ghi** — chỉ `service_role` ghi được, qua script chạy ở máy.

`pantry_items.ingredient_id` **cố tình không có khoá ngoại**: người dùng tự thêm
được nguyên liệu ngoài danh mục, lúc đó id có dạng `custom-<slug>`. Nếu ai đó
"sửa" bằng cách thêm khoá ngoại thì tính năng tự thêm nguyên liệu sẽ gãy.

---

## 9. Kiểm thử

Chưa có test runner, và đó là lựa chọn có ý thức.

Test duy nhất là `scripts/test/chat-guardrails.ts`, chạy bằng `npm run test:chat`:
script `tsx` độc lập, tự in `✓` và tổng kết, dùng response Gemini giả nên không
tốn quota và không cần API key. Hiện 13 khẳng định, phủ đúng phần rủi ro nhất —
rào chắn chống AI bịa id.

Viết test mới thì theo đúng kiểu đó: một script trong `scripts/test/`, thêm một
dòng vào `package.json`. **Đừng kéo Jest hay Vitest vào chỉ để viết một test** —
chi phí cấu hình lớn hơn giá trị ở quy mô này. Khi nào có ~5 file test thì tính lại.

Ưu tiên test cho: rào chắn AI, `suggest.ts` (logic thuần, dễ test), và mọi thứ
liên quan tới tránh nguyên liệu gây dị ứng.

---

## 10. Comment

Quy tắc đầy đủ nằm trong khối `nf:code-comments` của `AGENTS.md`. Tóm tắt: đổi
tên, tách hàm, cấu trúc lại trước; comment là lựa chọn cuối cùng; và comment ghi
**vì sao**, không ghi **cái gì**.

Repo này đang làm đúng — vài ví dụ đáng bắt chước:

```ts
// Mâm đầu tiên luôn giữ lại để người dùng có gợi ý, các mâm sau mới lọc thời gian
if (maxMinutes && minutes > maxMinutes && plans.length > 0) continue;
```

```ts
// core rỗng nghĩa là AI bỏ hết nguyên liệu chính -> vô lý, không nhận
core: core && core.length > 0 ? core : undefined,
```

Cả hai đều ghi lại một quyết định mà đọc code không suy ra được, và đều ngăn
người sau "dọn dẹp" nhầm.

---

## 11. Git

- Commit message tiếng Việt không dấu, có tiền tố quy ước:
  `feat:`, `fix:`, `chore:`, `docs:`.
- Làm một mình, code vào thẳng `master`. Không remote, không CI, không môi trường
  staging / production.
- Không commit `.env.local`, ảnh trung gian khi render video, hay `node_modules`.
  `.gitignore` đã chặn; đừng dùng `git add -f` để lách.

---

## 12. Không làm

- Không hardcode giá trị cấu hình — dùng biến môi trường.
- Không để khoá service account Google Cloud hay `SUPABASE_SERVICE_ROLE_KEY` chạm tới code client.
- Không sửa tay file trong `src/components/ui/` — shadcn CLI sẽ ghi đè.
- Không sửa `supabase/seed.sql` trực tiếp — sửa `src/data` rồi `npm run seed:gen`.
- Không đổi id nguyên liệu / id món đã phát hành.
- Không tin id do AI trả về mà chưa đối chiếu danh mục.
- Không thêm thư viện state management.
- Không thêm CI, Dockerfile, hay manifest deploy — dự án cá nhân, không deploy.
