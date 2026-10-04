-- Tủ Lạnh Ra Món - bù hồ sơ cho tài khoản chưa có
-- Chạy sau 0006_ho_so_theo_cot.sql:
-- Supabase > SQL Editor > New query > dán cả file > Run. Chạy lại bao nhiêu
-- lần cũng được: chỉ thêm hồ sơ cho tài khoản còn thiếu.
--
-- tlrm.profiles đang rỗng dù đã có tài khoản đăng bài, nên mọi bài hiện
-- "Người nấu ẩn danh" và không ai có trang bếp. Tài khoản tạo ra lúc trigger
-- đăng ký chưa gắn (hoặc gắn hỏng) thì không bao giờ có hồ sơ.

begin;

-- Từng tài khoản một chứ không INSERT ... SELECT: suggest_handle() kiểm tra
-- handle trùng bằng cách đọc bảng, mà trong một câu lệnh nó không thấy những
-- dòng chính câu đó vừa thêm - hai người cùng tên email sẽ đụng unique.
do $$
declare
  u    record;
  seed text;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
      from auth.users au
      left join tlrm.profiles p on p.id = au.id
     where p.id is null
  loop
    seed := coalesce(u.raw_user_meta_data ->> 'display_name',
                     split_part(u.email, '@', 1));
    insert into tlrm.profiles (id, display_name, handle)
    values (u.id, seed, tlrm.suggest_handle(seed))
    on conflict (id) do nothing;
  end loop;
end;
$$;

-- Gắn lại trigger đăng ký phòng khi nó chưa từng được tạo. Tên có hậu tố
-- _tlrm vì auth.users dùng chung cả project (xem 0001).
drop trigger if exists on_auth_user_created_tlrm on auth.users;
create trigger on_auth_user_created_tlrm
  after insert on auth.users
  for each row execute function tlrm.handle_new_user();

commit;

-- Kiểm tra: hai số phải bằng nhau.
select (select count(*) from auth.users)    as so_tai_khoan,
       (select count(*) from tlrm.profiles) as so_ho_so;
