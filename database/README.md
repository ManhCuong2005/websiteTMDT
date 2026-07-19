# Database

Khuyến nghị chỉ chạy `00_create_database.sql`, sau đó để Flyway của backend tự chạy `01_schema.sql` và `02_seed_data.sql`.

Các bảng hiện tại:

- users
- categories
- products
- coupons
- carts
- cart_items
- addresses
- orders
- order_items
- payments
- reviews

Khi thêm AI và blockchain, có thể tạo migration mới như:

- V3__ai_interactions.sql
- V4__blockchain_transactions.sql
