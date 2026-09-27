-- Tủ Lạnh Ra Món - cộng đồng chia sẻ món ăn
-- Chạy sau 0001_init.sql và 0002_bua_sang.sql:
-- Supabase > SQL Editor > New query > dán cả file > Run.
--
-- Thêm: hồ sơ công khai (handle), bài đăng khoe mâm cơm, thích, bình luận,
-- theo dõi, và bucket ảnh `anh-mon`.

begin;

-- ------------------------------------------------- hồ sơ công khai
-- Bài đăng hiện tên và link tới bếp của người đăng, nên profiles cần phần
-- công khai. household_size vẫn ở đây nhưng không lộ ra ngoài: view
-- tlrm.public_profiles bên dưới mới là thứ anon đọc được.
alter table tlrm.profiles add column if not exists handle text;
alter table tlrm.profiles add column if not exists bio text;
alter table tlrm.profiles add column if not exists avatar_url text;

do $$ begin
  alter table tlrm.profiles add constraint profiles_handle_format
    check (handle is null or handle ~ '^[a-z0-9][a-z0-9-]{2,23}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table tlrm.profiles add constraint profiles_bio_len
    check (bio is null or length(bio) <= 280);
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_handle_key
  on tlrm.profiles (handle);

/** Sinh handle chưa ai dùng từ một chuỗi gợi ý (thường là phần trước @ của email). */
create or replace function tlrm.suggest_handle(seed text)
returns text
language plpgsql
security definer
set search_path = tlrm, public
as $$
declare
  base      text;
  candidate text;
  n         integer := 0;
begin
  base := lower(coalesce(seed, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  if length(base) < 3 then
    base := 'bep-' || substr(md5(random()::text), 1, 6);
  end if;
  base := left(base, 20);
  candidate := base;

  while exists (select 1 from tlrm.profiles p where p.handle = candidate) loop
    n := n + 1;
    candidate := left(base, 18) || '-' || n;
  end loop;

  return candidate;
end;
$$;

-- Người đăng ký từ trước 0003 chưa có handle
update tlrm.profiles
   set handle = tlrm.suggest_handle(coalesce(display_name, 'bep'))
 where handle is null;

create or replace function tlrm.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = tlrm, public
as $$
declare
  seed text := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(new.email, '@', 1)
  );
begin
  insert into tlrm.profiles (id, display_name, handle)
  values (new.id, seed, tlrm.suggest_handle(seed))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ------------------------------------------------------- bài đăng
-- dish_id có thể null: người dùng khoe món ngoài danh mục. dish_name luôn có
-- để bài đăng vẫn đọc được khi món gốc bị xoá khỏi danh mục.
create table if not exists tlrm.posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references auth.users (id) on delete cascade,
  dish_id        text references tlrm.dishes (id) on delete set null,
  dish_name      text not null check (length(btrim(dish_name)) between 1 and 120),
  caption        text not null default '' check (length(caption) <= 2000),
  -- đường dẫn trong bucket anh-mon, dạng <user_id>/<uuid>.jpg
  image_path     text,
  minutes        integer check (minutes is null or minutes between 1 and 1440),
  ingredient_ids text[] not null default '{}',
  like_count     integer not null default 0,
  comment_count  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists posts_created_idx on tlrm.posts (created_at desc);
create index if not exists posts_author_idx  on tlrm.posts (author_id, created_at desc);
create index if not exists posts_dish_idx    on tlrm.posts (dish_id);

drop trigger if exists posts_touch_updated_at on tlrm.posts;
create trigger posts_touch_updated_at
  before update on tlrm.posts
  for each row execute function tlrm.touch_updated_at();

create table if not exists tlrm.post_likes (
  post_id    uuid not null references tlrm.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on tlrm.post_likes (user_id);

create table if not exists tlrm.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references tlrm.posts (id) on delete cascade,
  author_id  uuid not null references auth.users (id) on delete cascade,
  body       text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx
  on tlrm.post_comments (post_id, created_at);

create table if not exists tlrm.follows (
  follower_id  uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on tlrm.follows (following_id);

-- ------------------------------------------- đếm thích / bình luận
-- Giữ số đếm ngay trên posts để feed không phải count() từng bài.
create or replace function tlrm.bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = tlrm
as $$
begin
  if tg_op = 'INSERT' then
    update tlrm.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  else
    update tlrm.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end;
$$;

drop trigger if exists post_likes_count on tlrm.post_likes;
create trigger post_likes_count
  after insert or delete on tlrm.post_likes
  for each row execute function tlrm.bump_like_count();

create or replace function tlrm.bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = tlrm
as $$
begin
  if tg_op = 'INSERT' then
    update tlrm.posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  else
    update tlrm.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end;
$$;

drop trigger if exists post_comments_count on tlrm.post_comments;
create trigger post_comments_count
  after insert or delete on tlrm.post_comments
  for each row execute function tlrm.bump_comment_count();

-- --------------------------------------------------- hồ sơ công khai
-- Khách chưa đăng nhập thấy tên và handle của người đăng, không thấy
-- household_size. RLS của bảng gốc không lọc được theo cột nên dùng view.
create or replace view tlrm.public_profiles
with (security_invoker = true) as
  select id, handle, display_name, bio, avatar_url, created_at
    from tlrm.profiles;

-- ------------------------------------------------------------ bảo mật
alter table tlrm.posts         enable row level security;
alter table tlrm.post_likes    enable row level security;
alter table tlrm.post_comments enable row level security;
alter table tlrm.follows       enable row level security;

-- Bài đăng là nội dung công khai: ai cũng đọc, chỉ chủ bài mới sửa/xoá.
drop policy if exists posts_read on tlrm.posts;
create policy posts_read on tlrm.posts
  for select to anon, authenticated using (true);

drop policy if exists posts_insert_own on tlrm.posts;
create policy posts_insert_own on tlrm.posts
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists posts_update_own on tlrm.posts;
create policy posts_update_own on tlrm.posts
  for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists posts_delete_own on tlrm.posts;
create policy posts_delete_own on tlrm.posts
  for delete to authenticated using (auth.uid() = author_id);

drop policy if exists post_likes_read on tlrm.post_likes;
create policy post_likes_read on tlrm.post_likes
  for select to anon, authenticated using (true);

drop policy if exists post_likes_own on tlrm.post_likes;
create policy post_likes_own on tlrm.post_likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists post_likes_unlike on tlrm.post_likes;
create policy post_likes_unlike on tlrm.post_likes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists post_comments_read on tlrm.post_comments;
create policy post_comments_read on tlrm.post_comments
  for select to anon, authenticated using (true);

drop policy if exists post_comments_insert_own on tlrm.post_comments;
create policy post_comments_insert_own on tlrm.post_comments
  for insert to authenticated with check (auth.uid() = author_id);

-- Chủ bình luận xoá được bình luận của mình, chủ bài xoá được bình luận trong bài mình
drop policy if exists post_comments_delete on tlrm.post_comments;
create policy post_comments_delete on tlrm.post_comments
  for delete to authenticated using (
    auth.uid() = author_id
    or exists (select 1 from tlrm.posts p where p.id = post_id and p.author_id = auth.uid())
  );

drop policy if exists follows_read on tlrm.follows;
create policy follows_read on tlrm.follows
  for select to anon, authenticated using (true);

drop policy if exists follows_own on tlrm.follows;
create policy follows_own on tlrm.follows
  for insert to authenticated with check (auth.uid() = follower_id);

drop policy if exists follows_unfollow on tlrm.follows;
create policy follows_unfollow on tlrm.follows
  for delete to authenticated using (auth.uid() = follower_id);

-- profiles_self của 0001 chỉ cho chủ hồ sơ đọc. Bài đăng cần tên người khác,
-- nên mở thêm quyền đọc; ghi vẫn chỉ chủ hồ sơ.
drop policy if exists profiles_read_public on tlrm.profiles;
create policy profiles_read_public on tlrm.profiles
  for select to anon, authenticated using (true);

-- -------------------------------------------------------------- quyền
grant select on tlrm.posts, tlrm.post_likes, tlrm.post_comments,
                tlrm.follows, tlrm.public_profiles
  to anon, authenticated;

grant select on tlrm.profiles to anon;

grant insert, update, delete on tlrm.posts to authenticated;
grant insert, delete on tlrm.post_likes, tlrm.post_comments, tlrm.follows
  to authenticated;

commit;

-- ------------------------------------------------------ ảnh món ăn
-- storage.buckets và storage.objects là bảng DÙNG CHUNG cả project, nên mọi
-- policy ở đây đều có tiền tố tlrm_ để không đè lên dự án khác.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anh-mon', 'anh-mon', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists tlrm_anh_mon_read on storage.objects;
create policy tlrm_anh_mon_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'anh-mon');

-- Ảnh nằm trong thư mục mang tên user id, nên không ai ghi đè ảnh người khác.
drop policy if exists tlrm_anh_mon_insert on storage.objects;
create policy tlrm_anh_mon_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'anh-mon'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists tlrm_anh_mon_delete on storage.objects;
create policy tlrm_anh_mon_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'anh-mon'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
