-- 000002_create_products_table.down
-- Drop users table and related objects

DROP INDEX IF EXISTS idx_products_created_at;
DROP INDEX IF EXISTS idx_products_title;
DROP TABLE IF EXISTS products;