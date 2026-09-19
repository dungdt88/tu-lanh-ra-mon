# AGENTS.md - Coding Agent Instructions

**Tủ Lạnh Ra Món** — web app gợi ý mâm cơm từ nguyên liệu đang có trong tủ lạnh.
Người dùng đích: mẹ đi làm văn phòng, tan làm 5h chiều, nấu cho chồng và 2 con;
bài toán là *hôm nay ăn gì* — đủ chất, không lặp món, nấu xong trong ~30 phút.

Next.js 16 (App Router) + TypeScript, chạy SSR kèm vài route API. Dữ liệu danh mục
đọc từ Supabase khi có env, không thì rơi về mock trong `src/data`. Nhận diện ảnh
tủ lạnh và trợ lý chat gọi Gemini, cũng có bản mô phỏng khi thiếu key — nên app
luôn chạy được với `.env.local` để trống.

Đây là **dự án cá nhân**: không có remote, không CI, không môi trường staging /
production. Đừng thêm hạ tầng mà repo không dùng.

## Branching

Làm một mình, code vào thẳng `master`. Không có remote, không có nhánh `release`,
không có môi trường staging / production. Chỉ tách nhánh ngắn hạn khi muốn xem lại
một thay đổi riêng, xong thì fast-forward vào `master`.

## Lệnh hay dùng

```bash
npm install
npm run dev           # http://localhost:3000
npm run dev:lan       # mở cho điện thoại cùng wifi: http://<ip-máy>:3000
npm run build         # build production (đồng thời typecheck)
npm run start         # chạy bản đã build

npm run lint          # eslint (next core-web-vitals + typescript)
npm run typecheck     # tsc --noEmit, nhanh hơn build nhiều
npm run format        # prettier --write trên src/
npm run format:check  # prettier --check, không sửa file

npm run test:chat     # rào chắn của POST /api/chat (dùng Gemini giả, không tốn quota)
npm run seed:gen      # sinh supabase/seed.sql từ src/data
npm run db:check      # kiểm tra kết nối + dữ liệu Supabase
```

Trước khi kết thúc một thay đổi: `npm run typecheck && npm run lint`, và
`npm run test:chat` nếu có đụng vào `src/app/api/chat` hay `src/lib/gemini-chat.ts`.

Lỗi `Cannot find module '../lightningcss.darwin-arm64.node'` (hoặc native tương tự)
nghĩa là `node_modules` chứa binary của HĐH khác:
`rm -rf node_modules .next && npm install` trên chính máy đang dev.

## Tech stack

- Next.js 16 App Router + React 19 + TypeScript 5
- Tailwind CSS v4 + shadcn/ui (style `new-york`), font Be Vietnam Pro self-host qua Fontsource
- `next-themes` cho sáng/tối (mặc định theo cài đặt máy)
- Supabase (`@supabase/ssr` + `@supabase/supabase-js`) — tuỳ chọn, có fallback mock
- Google Gemini cho nhận diện ảnh và chat — tuỳ chọn, có fallback mô phỏng
- Mobile-first: chạy tốt từ 320px, breakpoint `xs` (400px), tôn trọng safe-area iPhone

## Cấu trúc dự án

```
src/
  app/
    page.tsx              Trang chủ = mâm cơm hôm nay (mở app là thấy ngay)
    quet/                 Chụp/chọn ảnh tủ lạnh -> nhận diện nguyên liệu
    tu-lanh/              Toàn bộ danh mục nguyên liệu
    tro-ly/               Trợ lý chat
    mon/[slug]/           Chi tiết món: nguyên liệu, các bước, dinh dưỡng
    api/recognize/        API nhận diện nguyên liệu từ ảnh
    api/chat/             API trợ lý chat
  components/
    ui/                   shadcn/ui, sinh ra bởi CLI — đừng sửa tay
    dish-card, meal-plan-card, dish-detail, bottom-nav, page-header, ...
  data/
    ingredients.ts        Danh mục nguyên liệu (cờ `staple` cho gia vị luôn có)
    dishes.ts             Công thức món ăn (mock data)
  lib/
    repo/catalog.ts       Nguồn dữ liệu: Supabase nếu có env, không thì src/data
    catalog-context.tsx   Đưa danh mục xuống component client
    supabase/             client (browser) + server (SSR cookie) + kiểu dữ liệu
    suggest.ts            Chấm điểm món + dựng mâm cơm (mặn + canh + rau)
    gemini.ts             Nhận diện nguyên liệu từ ảnh
    gemini-chat.ts        Trợ lý chat + rào chắn chống bịa id
    pantry-store.tsx      Store tủ lạnh (useSyncExternalStore + localStorage)
    types.ts              Kiểu dùng chung toàn app
supabase/
  migrations/             Schema + RLS
  seed.sql                Sinh từ src/data bằng npm run seed:gen
scripts/
  generate-seed.ts, check-db.ts, test/, intro/, promo/
```

`@/` là alias tới `src/` (xem `tsconfig.json`). Dùng nó thay cho đường dẫn tương đối
nhiều cấp.

## Quy ước code

Prettier chạy mặc định (không có file config): nháy kép, chấm phẩy, thụt 2 khoảng
trắng, xuống dòng ở 80 ký tự, dấu phẩy cuối. Đừng tự đặt quy ước khác — cứ chạy
`npm run format`.

- `type` cho hình dạng dữ liệu, `interface` chỉ khi cần merge — repo hiện chỉ dùng `type`.
- Import kiểu bằng `import type { ... }`.
- Tên file kebab-case (`meal-plan-card.tsx`), tên component PascalCase,
  hàm và biến camelCase.
- Server code đụng key bí mật phải `import "server-only"`.
- TSDoc `/** ... */` một dòng cho field và hàm cần giải thích; viết tiếng Việt,
  giống phần còn lại của repo.

<!-- nf:code-comments v1 — managed by nf-init-project -->
## Code comments

**Make the code explain itself; comment only what the code cannot say.**

A comment is a liability: nothing verifies it, and it silently goes stale the
first time someone changes the code beside it. A good name or a small extracted
function carries the same meaning and cannot drift. Reach for the comment last.

Before writing a comment, try in this order:

1. **Rename.** `retry_after_seconds` instead of `t` plus a comment saying what
   `t` holds. `is_eligible_for_refund` instead of a comment explaining the
   condition.
2. **Extract.** Pull the block into a well-named function or a named
   intermediate variable. A comment introducing a ten-line block usually means
   that block wants to be a function whose name is that comment.
3. **Restructure.** Early return instead of `// happy path continues here`.
   A dataclass/enum/type instead of `// keys: id, name, status`.

Only then write the comment.

### Comment the *why*, never the *what*

The diff shows what changed; the code shows what it does. A comment earns its
place when it records something not recoverable from reading the code:

- a non-obvious constraint (an upstream API caps the page size at 100)
- a deliberate trade-off, and what was rejected
- a workaround, with what breaks without it
- a correctness trap the next reader would otherwise "clean up"

```ts
// The vendor's cursor expires after 60s, so re-page from scratch rather than
// resuming — resuming silently returns a truncated result set.
```

### Do not write

- **Narration** — `// loop over the users`, `// increment the counter`,
  `// return the result`.
- **Section dividers** — `// --- helpers ---`, `// Step 1: validate`. If a
  function needs internal chapters, it wants to be several functions.
- **Signature restatement** — a docstring that only re-lists the parameters and
  their types with no added meaning.
- **Change narration** — `// added validation`, `// updated to use the new API`,
  `// was previously a list`. That belongs in the commit message; the code is
  read by people who will never see this change in isolation.
- **Commented-out code.** Delete it — git remembers.
- **`TODO` without an owner and a condition.** `// TODO: make this faster` is
  noise; `// TODO: drop this fallback once every client sends the header` is a
  real note.

### Docstrings are different

Docstrings are API documentation, not commentary, and this repo's style section
governs them. Write one for anything another module calls — what it does, what
it returns, what it raises — and skip it for a short private helper whose name
already says it. Follow the format the surrounding code already uses.

### Reviewing your own output

Before finishing a change, reread the diff and delete every comment that only
restates the line below it. Density is the tell: several comments in one short
function almost always means the function needs better names or splitting, not
better comments.
<!-- /nf:code-comments -->

## Kiểm thử

Chưa có test runner. Test duy nhất là `scripts/test/chat-guardrails.ts`
(`npm run test:chat`): chạy bằng `tsx`, tự in `✓` / tổng kết, dùng response Gemini
giả nên không tốn quota và không cần API key.

Khi thêm test mới cho rào chắn hoặc logic thuần (ví dụ `suggest.ts`), theo đúng
kiểu đó — script `tsx` độc lập trong `scripts/test/`, thêm một dòng vào
`package.json` scripts. Đừng kéo Jest/Vitest vào chỉ để viết một test.

## Cấu hình & bí mật

`.env.local` ở gốc repo, không commit (`.gitignore` chặn `.env*` trừ `.env.example`).
Điền theo `.env.example`:

| Biến | Bắt buộc? | Dùng để |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | không | đọc danh mục từ DB; trống thì dùng `src/data` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | không | như trên |
| `GEMINI_API_KEY` | không | nhận diện ảnh + chat; trống thì chạy bản mô phỏng |
| `GEMINI_MODEL` | không | mặc định `gemini-3.6-flash` |
| `SUPABASE_SERVICE_ROLE_KEY` | không | chỉ cho script chạy ở máy (seed). **Không bao giờ đưa ra client** |
| `GEMINI_BASE_URL` | không | trỏ sang server giả khi test |

Bảng của dự án nằm trong schema **`tlrm`**, không phải `public`. Tên schema khai
ở `DB_SCHEMA` trong `src/lib/supabase/env.ts` — đừng viết thẳng vào chỗ khác.

Mọi biến mới đọc qua `src/lib/supabase/env.ts` hoặc module config tương ứng, không
đọc `process.env` rải rác trong component.

## Do NOT

- Do NOT hardcode giá trị cấu hình — dùng biến môi trường.
- Do NOT commit secret, `.env.local`, hay key vào repo.
- Do NOT để `SUPABASE_SERVICE_ROLE_KEY` hay `GEMINI_API_KEY` lọt vào bundle client;
  code server đụng chúng phải `import "server-only"`.
- Do NOT sửa tay file trong `src/components/ui/` — chúng do shadcn CLI sinh ra.
- Do NOT sửa `supabase/seed.sql` trực tiếp — sửa `src/data` rồi `npm run seed:gen`.
- Do NOT bỏ qua `npm run typecheck` và `npm run lint` trước khi kết thúc thay đổi.
- Do NOT thêm CI, Dockerfile, hay manifest deploy — dự án cá nhân, không deploy.
- Do NOT narrate code bằng comment — đổi tên, tách hàm, hoặc cấu trúc lại để code
  tự đọc được, comment để dành cho phần *tại sao*.

## Tham chiếu

- `docs/business-requirements.md` — sản phẩm giải bài toán gì, máy gợi ý chấm điểm
  ra sao, rào chắn chống AI bịa id. **Đọc trước khi đụng vào `suggest.ts` hay route API.**
- `docs/design-system.md` — token màu, thang chữ, bo góc, bố cục, component có sẵn.
  **Đọc trước khi thêm giao diện mới.**
- `docs/conventions.md` — bản đầy đủ của các quy ước trong file này, kèm lý do
- `docs/supabase-setup.md` — dựng database: schema `tlrm`, quyền, expose API, đổ dữ liệu
- `README.md` — cách chạy, cách điền key, nguyên tắc UX, cách gợi ý hoạt động, roadmap
- `src/lib/suggest.ts` — `matchDish()` chấm điểm món, `buildMealPlans()` dựng mâm cơm
- `supabase/migrations/` — schema và RLS
- `ghi-chu/` — ghi chú rời trong quá trình làm
