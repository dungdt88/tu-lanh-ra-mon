-- Tủ Lạnh Ra Món - công thức nhà mình
-- Chạy sau 0003_cong_dong.sql:
-- Supabase > SQL Editor > New query > dán cả file > Run.
--
-- Thêm: công thức do người dùng tự viết, để riêng hoặc công khai, và đường nối
-- từ bài khoe món về công thức đã nấu.

begin;

-- Không có cột dinh dưỡng như tlrm.dishes: người nhà viết công thức thì không
-- ai ngồi tính kcal, app cũng không hỏi.
create table if not exists tlrm.recipes (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(btrim(name)) between 1 and 120),
  emoji       text not null default '🍲',
  summary     text not null default '' check (length(summary) <= 280),
  role        tlrm.dish_role not null default 'man',
  slots       tlrm.meal_slot[] not null default '{trua,toi}',
  minutes     integer not null default 30 check (minutes between 1 and 1440),
  servings    smallint not null default 4 check (servings between 1 and 20),
  difficulty  smallint not null default 1 check (difficulty between 1 and 3),
  -- Id nguyên liệu trong danh mục, đã đối chiếu ở server action trước khi lưu.
  -- Máy gợi ý chỉ chấm điểm được những id này.
  core        text[] not null default '{}',
  optional    text[] not null default '{}',
  -- Nguyên liệu nhà tự gõ, không có trong danh mục: chỉ để hiện lên cho người
  -- đọc, máy gợi ý không dùng tới.
  extras      text[] not null default '{}',
  steps       text[] not null default '{}',
  tip         text check (tip is null or length(tip) <= 500),
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists recipes_author_idx
  on tlrm.recipes (author_id, updated_at desc);

create index if not exists recipes_public_idx
  on tlrm.recipes (updated_at desc) where is_public;

drop trigger if exists recipes_touch_updated_at on tlrm.recipes;
create trigger recipes_touch_updated_at
  before update on tlrm.recipes
  for each row execute function tlrm.touch_updated_at();

-- Bài khoe món nấu theo công thức nhà mình thì trỏ về công thức đó. dish_id của
-- bài vẫn dành cho món trong danh mục, hai thứ không lẫn nhau.
alter table tlrm.posts add column if not exists recipe_id uuid
  references tlrm.recipes (id) on delete set null;

alter table tlrm.recipes enable row level security;

drop policy if exists recipes_own on tlrm.recipes;
create policy recipes_own on tlrm.recipes
  for all to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Công thức để công khai thì ai cũng đọc, kể cả khách chưa đăng nhập
drop policy if exists recipes_read_public on tlrm.recipes;
create policy recipes_read_public on tlrm.recipes
  for select to anon, authenticated using (is_public);

grant select on tlrm.recipes to anon;
grant select, insert, update, delete on tlrm.recipes to authenticated;

commit;
