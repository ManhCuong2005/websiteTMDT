-- Chạy file này khi đang kết nối vào database mặc định "postgres".
SELECT 'CREATE DATABASE banhang_db WITH ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'banhang_db')\gexec
