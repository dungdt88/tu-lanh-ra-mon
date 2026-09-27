# Tài liệu — Tủ Lạnh Ra Món

Bộ tài liệu nền, viết ngược từ mã nguồn. Chúng mô tả **sự thật hiện tại** của
repo, không phải kế hoạch — phần chưa làm được tách riêng và ghi rõ.

| Tài liệu | Trả lời câu hỏi |
| --- | --- |
| [business-requirements.md](business-requirements.md) | Sản phẩm giải bài toán gì, gợi ý món hoạt động ra sao, rào chắn AI là gì |
| [design-system.md](design-system.md) | Token màu, chữ, bo góc, bố cục, component có sẵn |
| [conventions.md](conventions.md) | Viết code ở repo này theo quy ước nào, và vì sao |
| [supabase-setup.md](supabase-setup.md) | Dựng database: schema `tlrm`, quyền, expose API, đổ dữ liệu |
| [vertex-setup.md](vertex-setup.md) | Dựng Vertex AI: project, service account, quyền, kiểm tra, chi phí |

Chỗ khác cần biết:

- `../README.md` — cách chạy dự án, cách điền key, roadmap
- `../AGENTS.md` — bản tóm tắt cho AI agent đọc trước khi sửa code
- `../ghi-chu/` — ghi chú rời trong quá trình làm

## Giữ tài liệu khỏi lỗi thời

Ba tài liệu trên nêu **con số cụ thể** (58 nguyên liệu, 28 món, số mâm dựng được
mỗi bữa) và **hành vi cụ thể** đọc ra từ code. Chúng sẽ sai dần nếu không ai
đụng tới.

Cần cập nhật khi:

| Thay đổi | Tài liệu phải sửa |
| --- | --- |
| Thêm/bớt món hoặc nguyên liệu trong `src/data/` | business-requirements §2, §3 |
| Đổi trọng số chấm điểm trong `suggest.ts` | business-requirements §3 |
| Đổi rào chắn ở `/api/chat` hoặc `/api/recognize` | business-requirements §4 |
| Thêm token màu hoặc breakpoint trong `globals.css` | design-system §2, §5 |
| Thêm component vào `src/components/` | design-system §6 |
| Thêm migration trong `supabase/migrations/` | business-requirements §9 + supabase-setup §1 |
| Đổi quy ước code | conventions + khối tương ứng trong `AGENTS.md` |
