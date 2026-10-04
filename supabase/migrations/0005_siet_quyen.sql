-- Tủ Lạnh Ra Món - siết quyền ghi/đọc qua API
-- Chạy sau 0004_cong_thuc_rieng.sql:
-- Supabase > SQL Editor > New query > dán cả file > Run.
--
-- Người đã đăng nhập cầm anon key + token của chính mình là gọi thẳng được
-- PostgREST, không cần đi qua server action. Những gì server action không
-- làm thì database phải tự chặn.

begin;

-- ------------------------------------------------------ hồ sơ công khai
-- 0003 mở `profiles_read_public using (true)` để view public_profiles (chạy
-- quyền người gọi) đọc được hồ sơ người khác - nhưng thế thì ai cũng đọc thẳng
-- được bảng gốc, kể cả household_size, và view không còn che được gì.
--
-- Đổi lại: view chạy bằng quyền chủ view (bỏ qua RLS) và chỉ lộ cột công
-- khai; bảng gốc quay về profiles_self của 0001 - chỉ chủ hồ sơ đọc.
alter view tlrm.public_profiles set (security_invoker = false);

drop policy if exists profiles_read_public on tlrm.profiles;

revoke select on tlrm.profiles from anon;

-- ------------------------------------------------------------ bài đăng
-- App không bao giờ sửa bài đã đăng. Để quyền update thì chủ bài tự đặt
-- like_count / comment_count tuỳ ý, hay đổi nội dung sau khi đã qua kiểm duyệt.
revoke update on tlrm.posts from authenticated;
drop policy if exists posts_update_own on tlrm.posts;

-- Số đếm do trigger giữ; người đăng chỉ được ghi những cột dangBai ghi.
revoke insert on tlrm.posts from authenticated;
grant insert (author_id, dish_id, recipe_id, dish_name, caption, image_path,
              minutes, ingredient_ids)
  on tlrm.posts to authenticated;

commit;
