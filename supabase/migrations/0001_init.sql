-- Tủ Lạnh Ra Món - schema khởi tạo
-- Chạy trên Supabase: SQL Editor > New query > dán file này > Run
-- Hoặc: supabase db push (khi dùng Supabase CLI)
--
-- Toàn bộ dự án nằm trong schema riêng `tlrm`, không dùng `public`, để không
-- lẫn với dự án khác trong cùng một project Supabase.
--
-- LƯU Ý VỀ PHẠM VI: anon key là của cả project, không phải của riêng schema.
-- Schema riêng cho ta sự gọn gàng về tên, KHÔNG cho ta sự cô lập về quyền.
-- Muốn key của app này không với tới schema khác thì phải thu hồi quyền của
-- `anon` ở schema đó, hoặc bỏ nó khỏi "Exposed schemas" trong Settings > API.

begin;

create schema if not exists tlrm;

-- ---------------------------------------------------------------- kiểu dữ liệu
do $$ begin
  create type tlrm.ingredient_category as enum
    ('thit', 'hai-san', 'rau', 'cu-qua', 'trung-sua', 'kho', 'gia-vi', 'khac');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tlrm.dish_role as enum ('man', 'canh', 'rau', 'com');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tlrm.meal_slot as enum ('trua', 'toi');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------- danh mục
create table if not exists tlrm.ingredients (
  id          text primary key,
  name        text not null,
  emoji       text not null default '🥘',
  category    tlrm.ingredient_category not null,
  -- gia vị cơ bản: coi như bếp nào cũng có, không tính vào danh sách đi chợ
  staple      boolean not null default false,
  -- tên gọi khác để tìm kiếm: "đậu phụ", "thịt heo"...
  aliases     text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists tlrm.dishes (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  emoji       text not null default '🍽️',
  summary     text not null default '',
  role        tlrm.dish_role not null,
  slots       tlrm.meal_slot[] not null default '{trua,toi}',
  minutes     integer not null check (minutes > 0),
  servings    integer not null default 4 check (servings > 0),
  difficulty  smallint not null default 1 check (difficulty between 1 and 3),
  tags        text[] not null default '{}',
  kcal        integer not null default 0,
  protein     integer not null default 0,
  carb        integer not null default 0,
  fat         integer not null default 0,
  steps       text[] not null default '{}',
  tip         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists dishes_role_idx on tlrm.dishes (role);

-- required = true: nguyên liệu chính, thiếu thì phải đi chợ
-- required = false: có thì ngon hơn, không có vẫn nấu được
create table if not exists tlrm.dish_ingredients (
  dish_id       text not null references tlrm.dishes (id) on delete cascade,
  ingredient_id text not null references tlrm.ingredients (id) on delete restrict,
  required      boolean not null default true,
  position      smallint not null default 0,
  primary key (dish_id, ingredient_id)
);

create index if not exists dish_ingredients_ingredient_idx
  on tlrm.dish_ingredients (ingredient_id);

-- --------------------------------------------------------------- người dùng
create table if not exists tlrm.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text,
  household_size smallint not null default 4 check (household_size between 1 and 20),
  created_at     timestamptz not null default now()
);

-- Tủ lạnh của từng người.
-- ingredient_id cố tình KHÔNG khoá ngoại: người dùng tự điền được nguyên liệu
-- ngoài danh mục, lúc đó id có dạng custom-<slug> và custom_name giữ tên họ gõ.
create table if not exists tlrm.pantry_items (
  user_id       uuid not null references auth.users (id) on delete cascade,
  ingredient_id text not null,
  custom_name   text,
  added_at      timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);

-- Lịch sử món đã nấu, dùng để tránh lặp món trong tuần
create table if not exists tlrm.cook_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  dish_id    text references tlrm.dishes (id) on delete set null,
  dish_name  text not null,
  slot       tlrm.meal_slot not null,
  cooked_on  date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists cook_logs_user_date_idx
  on tlrm.cook_logs (user_id, cooked_on desc);

-- --------------------------------------------------------------- tự động hoá
create or replace function tlrm.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dishes_touch_updated_at on tlrm.dishes;
create trigger dishes_touch_updated_at
  before update on tlrm.dishes
  for each row execute function tlrm.touch_updated_at();

-- Tạo sẵn profile khi có người đăng ký
create or replace function tlrm.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = tlrm
as $$
begin
  insert into tlrm.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Tên trigger có hậu tố _tlrm vì auth.users là bảng DÙNG CHUNG cả project.
-- Tên trần `on_auth_user_created` là tên Supabase docs hay dùng, rất có thể dự án
-- khác trong project này đang dùng đúng tên đó - drop nó là xoá trigger của họ.
drop trigger if exists on_auth_user_created_tlrm on auth.users;
create trigger on_auth_user_created_tlrm
  after insert on auth.users
  for each row execute function tlrm.handle_new_user();

-- ------------------------------------------------------------------- bảo mật
alter table tlrm.ingredients      enable row level security;
alter table tlrm.dishes           enable row level security;
alter table tlrm.dish_ingredients enable row level security;
alter table tlrm.profiles         enable row level security;
alter table tlrm.pantry_items     enable row level security;
alter table tlrm.cook_logs        enable row level security;

-- Danh mục: ai cũng đọc được, chỉ service_role mới ghi (không tạo policy ghi)
drop policy if exists ingredients_read on tlrm.ingredients;
create policy ingredients_read on tlrm.ingredients
  for select to anon, authenticated using (true);

drop policy if exists dishes_read on tlrm.dishes;
create policy dishes_read on tlrm.dishes
  for select to anon, authenticated using (true);

drop policy if exists dish_ingredients_read on tlrm.dish_ingredients;
create policy dish_ingredients_read on tlrm.dish_ingredients
  for select to anon, authenticated using (true);

-- Dữ liệu cá nhân: mỗi người chỉ thấy và sửa được của mình
drop policy if exists profiles_self on tlrm.profiles;
create policy profiles_self on tlrm.profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists pantry_self on tlrm.pantry_items;
create policy pantry_self on tlrm.pantry_items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists cook_logs_self on tlrm.cook_logs;
create policy cook_logs_self on tlrm.cook_logs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------- quyền
-- Schema mới KHÔNG tự có quyền như `public` - phải cấp tay, nếu không
-- PostgREST trả 404/permission denied cho mọi bảng.
grant usage on schema tlrm to anon, authenticated, service_role;

-- Danh mục: ai cũng đọc được, không ai ghi được qua API
grant select on tlrm.ingredients, tlrm.dishes, tlrm.dish_ingredients
  to anon, authenticated;

-- Dữ liệu cá nhân: chỉ người đã đăng nhập; RLS lọc tiếp theo từng dòng
grant select, insert, update, delete
  on tlrm.profiles, tlrm.pantry_items, tlrm.cook_logs
  to authenticated;

-- service_role dùng cho script chạy ở máy (seed, job nền)
grant all on all tables in schema tlrm to service_role;
grant all on all sequences in schema tlrm to service_role;
alter default privileges in schema tlrm grant all on tables to service_role;

commit;
