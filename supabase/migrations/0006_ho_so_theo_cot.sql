-- Tủ Lạnh Ra Món - sửa 0005: hồ sơ công khai rỗng
-- Chạy sau 0005_siet_quyen.sql:
-- Supabase > SQL Editor > New query > dán cả file > Run.
--
-- 0005 cho view public_profiles chạy bằng quyền chủ view để bỏ qua RLS. Trên
-- Supabase chủ view vẫn bị RLS lọc, nên view trả về rỗng: bài đăng mất tên
-- người đăng.
--
-- Cách này không phụ thuộc ai là chủ view: mọi dòng đọc được (RLS mở như
-- trước 0005), nhưng chỉ CẤP QUYỀN theo cột - household_size không nằm trong
-- danh sách nên không ai đọc được qua API, kể cả qua view.

begin;

alter view tlrm.public_profiles set (security_invoker = true);

drop policy if exists profiles_read_public on tlrm.profiles;
create policy profiles_read_public on tlrm.profiles
  for select to anon, authenticated using (true);

revoke select on tlrm.profiles from anon, authenticated;
grant select (id, handle, display_name, bio, avatar_url, created_at)
  on tlrm.profiles to anon, authenticated;

commit;
