-- Thêm bữa sáng vào enum meal_slot.
-- Chạy file này TRƯỚC rồi mới chạy lại supabase/seed.sql
-- (Postgres không cho dùng giá trị enum mới ngay trong cùng transaction vừa thêm nó.)

alter type meal_slot add value if not exists 'sang' before 'trua';
