-- Tủ Lạnh Ra Món - schema khởi tạo
-- Chạy trên Supabase: SQL Editor > New query > dán file này > Run
-- Hoặc: supabase db push (khi dùng Supabase CLI)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- kiểu dữ liệu
do $$ begin
  create type ingredient_category as enum
    ('thit', 'hai-san', 'rau', 'cu-qua', 'trung-sua', 'kho', 'gia-vi', 'khac');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dish_role as enum ('man', 'canh', 'rau', 'com');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meal_slot as enum ('trua', 'toi');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------- danh mục
create table if not exists public.ingredients (
  id          text primary key,
  name        text not null,
  emoji       text not null default '🥘',
  category    ingredient_category not null,
  -- gia vị cơ bản: coi như bếp nào cũng có, không tính vào danh sách đi chợ
  staple      boolean not null default false,
  -- tên gọi khác để tìm kiếm: "đậu phụ", "thịt heo"...
  aliases     text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists public.dishes (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  emoji       text not null default '🍽️',
  summary     text not null default '',
  role        dish_role not null,
  slots       meal_slot[] not null default '{trua,toi}',
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

create index if not exists dishes_role_idx on public.dishes (role);

-- required = true: nguyên liệu chính, thiếu thì phải đi chợ
-- required = false: có thì ngon hơn, không có vẫn nấu được
create table if not exists public.dish_ingredients (
  dish_id       text not null references public.dishes (id) on delete cascade,
  ingredient_id text not null references public.ingredients (id) on delete restrict,
  required      boolean not null default true,
  position      smallint not null default 0,
  primary key (dish_id, ingredient_id)
);

create index if not exists dish_ingredients_ingredient_idx
  on public.dish_ingredients (ingredient_id);

-- --------------------------------------------------------------- người dùng
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text,
  household_size smallint not null default 4 check (household_size between 1 and 20),
  created_at     timestamptz not null default now()
);

-- Tủ lạnh của từng người.
-- ingredient_id cố tình KHÔNG khoá ngoại: người dùng tự điền được nguyên liệu
-- ngoài danh mục, lúc đó id có dạng custom-<slug> và custom_name giữ tên họ gõ.
create table if not exists public.pantry_items (
  user_id       uuid not null references auth.users (id) on delete cascade,
  ingredient_id text not null,
  custom_name   text,
  added_at      timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);

-- Lịch sử món đã nấu, dùng để tránh lặp món trong tuần
create table if not exists public.cook_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  dish_id    text references public.dishes (id) on delete set null,
  dish_name  text not null,
  slot       meal_slot not null,
  cooked_on  date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists cook_logs_user_date_idx
  on public.cook_logs (user_id, cooked_on desc);

-- --------------------------------------------------------------- tự động hoá
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dishes_touch_updated_at on public.dishes;
create trigger dishes_touch_updated_at
  before update on public.dishes
  for each row execute function public.touch_updated_at();

-- Tạo sẵn profile khi có người đăng ký
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------- bảo mật
alter table public.ingredients      enable row level security;
alter table public.dishes           enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.profiles         enable row level security;
alter table public.pantry_items     enable row level security;
alter table public.cook_logs        enable row level security;

-- Danh mục: ai cũng đọc được, chỉ service_role mới ghi (không tạo policy ghi)
drop policy if exists ingredients_read on public.ingredients;
create policy ingredients_read on public.ingredients
  for select to anon, authenticated using (true);

drop policy if exists dishes_read on public.dishes;
create policy dishes_read on public.dishes
  for select to anon, authenticated using (true);

drop policy if exists dish_ingredients_read on public.dish_ingredients;
create policy dish_ingredients_read on public.dish_ingredients
  for select to anon, authenticated using (true);

-- Dữ liệu cá nhân: mỗi người chỉ thấy và sửa được của mình
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists pantry_self on public.pantry_items;
create policy pantry_self on public.pantry_items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists cook_logs_self on public.cook_logs;
create policy cook_logs_self on public.cook_logs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
