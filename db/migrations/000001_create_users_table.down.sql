-- 000001_create_users_table.down.sql
-- Drop users table and related objects

DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
