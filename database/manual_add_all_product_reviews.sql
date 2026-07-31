-- Tạo dữ liệu mua hàng hợp lệ để mọi tài khoản đang hoạt động
-- đều đã mua, nhận và đánh giá tất cả sản phẩm đang hoạt động.
--
-- Hiện tại: 10 tài khoản x 20 sản phẩm = 200 cặp đánh giá.
-- Mỗi tài khoản có 2 đơn, mỗi đơn tối đa 10 sản phẩm.
-- Hai đánh giá đã tồn tại được giữ nguyên.
-- Có thể chạy lại mà không tạo trùng đơn, dòng hàng, thanh toán hoặc đánh giá.

BEGIN;

CREATE TEMP TABLE demo_review_users ON COMMIT DROP AS
SELECT
    user_data.id,
    user_data.full_name,
    user_data.email,
    user_data.phone,
    user_data.role,
    ROW_NUMBER() OVER (ORDER BY user_data.id)::INTEGER AS user_no
FROM users user_data
WHERE user_data.enabled = TRUE
  AND user_data.role IN ('CUSTOMER', 'STAFF', 'ADMIN');

CREATE TEMP TABLE demo_review_products ON COMMIT DROP AS
SELECT
    product_data.id,
    product_data.name,
    product_data.sku,
    product_data.image_url,
    product_data.price,
    product_data.category_id,
    ROW_NUMBER() OVER (ORDER BY product_data.id)::INTEGER AS product_no,
    (((ROW_NUMBER() OVER (ORDER BY product_data.id)) - 1) / 10 + 1)::INTEGER AS order_batch
FROM products product_data
WHERE product_data.active = TRUE;

DO $$
DECLARE
    active_user_count    INTEGER;
    active_product_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_user_count FROM demo_review_users;
    SELECT COUNT(*) INTO active_product_count FROM demo_review_products;

    IF active_user_count = 0 THEN
        RAISE EXCEPTION 'Không có tài khoản đang hoạt động để tạo đơn và đánh giá.';
    END IF;

    IF active_product_count = 0 THEN
        RAISE EXCEPTION 'Không có sản phẩm đang hoạt động để tạo đơn và đánh giá.';
    END IF;

    RAISE NOTICE
        'Chuẩn bị dữ liệu cho % tài khoản x % sản phẩm = % đánh giá.',
        active_user_count,
        active_product_count,
        active_user_count * active_product_count;
END
$$;

-- Mỗi tài khoản được chia thành các đơn, tối đa 10 sản phẩm/đơn.
WITH order_batches AS (
    SELECT
        review_user.id AS user_id,
        review_user.user_no,
        review_user.full_name,
        review_user.phone,
        review_user.role,
        review_product.order_batch,
        SUM(review_product.price) AS subtotal,
        CURRENT_TIMESTAMP
            - ((25 + review_user.user_no * 4 + review_product.order_batch * 18) * INTERVAL '1 day')
            AS delivered_time
    FROM demo_review_users review_user
    CROSS JOIN demo_review_products review_product
    GROUP BY
        review_user.id,
        review_user.user_no,
        review_user.full_name,
        review_user.phone,
        review_user.role,
        review_product.order_batch
)
INSERT INTO orders (
    order_code,
    user_id,
    status,
    payment_method,
    recipient_name,
    recipient_phone,
    shipping_address,
    subtotal,
    discount_amount,
    shipping_fee,
    total,
    coupon_code,
    note,
    cancel_reason,
    confirmed_at,
    delivered_at,
    created_at,
    updated_at
)
SELECT
    'DEMO-PRV-'
        || LPAD(order_batch.user_id::TEXT, 3, '0')
        || '-'
        || LPAD(order_batch.order_batch::TEXT, 2, '0'),
    order_batch.user_id,
    'DELIVERED',
    'COD',
    order_batch.full_name,
    COALESCE(NULLIF(order_batch.phone, ''), '0905000000'),
    COALESCE(
        (
            SELECT NULLIF(
                CONCAT_WS(
                    ', ',
                    user_address.address_line,
                    user_address.ward,
                    user_address.district,
                    user_address.province
                ),
                ''
            )
            FROM addresses user_address
            WHERE user_address.user_id = order_batch.user_id
            ORDER BY user_address.is_default DESC, user_address.id
            LIMIT 1
        ),
        '25 Nguyễn Văn Linh, Hải Châu, Đà Nẵng'
    ),
    order_batch.subtotal,
    0,
    0,
    order_batch.subtotal,
    NULL,
    '[DEMO-PRODUCT-REVIEWS] Đơn mua hàng đã nhận để tạo dữ liệu đánh giá sản phẩm.',
    NULL,
    order_batch.delivered_time - INTERVAL '6 days 20 hours',
    order_batch.delivered_time,
    order_batch.delivered_time - INTERVAL '7 days',
    order_batch.delivered_time
FROM order_batches order_batch
WHERE NOT EXISTS (
    SELECT 1
    FROM orders existing_order
    WHERE existing_order.order_code =
        'DEMO-PRV-'
        || LPAD(order_batch.user_id::TEXT, 3, '0')
        || '-'
        || LPAD(order_batch.order_batch::TEXT, 2, '0')
);

-- Lưu ảnh, tên, SKU và giá tại thời điểm mua giống luồng đặt hàng thật.
INSERT INTO order_items (
    order_id,
    product_id,
    product_name,
    product_sku,
    product_image_url,
    unit_price,
    quantity,
    line_total,
    created_at,
    updated_at
)
SELECT
    customer_order.id,
    review_product.id,
    review_product.name,
    review_product.sku,
    review_product.image_url,
    review_product.price,
    1,
    review_product.price,
    customer_order.created_at,
    customer_order.created_at
FROM demo_review_users review_user
CROSS JOIN demo_review_products review_product
JOIN orders customer_order
    ON customer_order.order_code =
        'DEMO-PRV-'
        || LPAD(review_user.id::TEXT, 3, '0')
        || '-'
        || LPAD(review_product.order_batch::TEXT, 2, '0')
WHERE NOT EXISTS (
    SELECT 1
    FROM order_items existing_item
    WHERE existing_item.order_id = customer_order.id
      AND existing_item.product_id = review_product.id
);

-- Đơn COD đã giao thành công tương ứng với thanh toán PAID.
INSERT INTO payments (
    order_id,
    method,
    status,
    amount,
    transaction_reference,
    paid_at,
    created_at,
    updated_at
)
SELECT
    customer_order.id,
    'COD',
    'PAID',
    customer_order.total,
    'COD-' || customer_order.order_code,
    customer_order.delivered_at,
    customer_order.created_at,
    customer_order.delivered_at
FROM orders customer_order
WHERE customer_order.order_code LIKE 'DEMO-PRV-%'
ON CONFLICT (order_id) DO NOTHING;

-- Sinh đánh giá đa dạng, phần lớn 4-5 sao nhưng vẫn có góp ý 3 sao.
-- ON CONFLICT DO NOTHING để giữ nguyên đánh giá thật đã có trước đó.
INSERT INTO reviews (
    user_id,
    product_id,
    rating,
    title,
    content,
    approved,
    created_at,
    updated_at
)
SELECT
    review_user.id,
    review_product.id,
    generated_review.rating,
    CASE generated_review.rating
        WHEN 5 THEN 'Rất hài lòng'
        WHEN 4 THEN 'Sản phẩm tốt'
        ELSE 'Đáp ứng nhu cầu'
    END,
    CASE generated_review.rating
        WHEN 5 THEN
            CASE MOD(review_user.user_no + review_product.product_no, 4)
                WHEN 0 THEN
                    review_product.name || ' đúng mô tả, đóng gói chắc chắn và sử dụng rất ổn định.'
                WHEN 1 THEN
                    'Tôi hài lòng với ' || review_product.name || '. Sản phẩm hoàn thiện tốt và giao đúng mẫu đã chọn.'
                WHEN 2 THEN
                    review_product.name || ' cho trải nghiệm tốt, hướng dẫn rõ ràng và chất lượng xứng đáng với giá tiền.'
                ELSE
                    'Đã sử dụng ' || review_product.name || ' một thời gian và thấy hiệu quả tốt, sẽ tiếp tục ủng hộ.'
            END
        WHEN 4 THEN
            CASE MOD(review_user.user_no + review_product.product_no, 3)
                WHEN 0 THEN
                    review_product.name || ' hoạt động tốt và đúng thông số. Phần bao bì có thể chỉn chu hơn một chút.'
                WHEN 1 THEN
                    'Chất lượng ' || review_product.name || ' tốt, giao hàng đầy đủ phụ kiện và sử dụng thuận tiện.'
                ELSE
                    review_product.name || ' đáp ứng đúng nhu cầu của gia đình, mức giá hợp lý và dễ sử dụng.'
            END
        ELSE
            CASE MOD(review_user.user_no + review_product.product_no, 2)
                WHEN 0 THEN
                    review_product.name || ' dùng ổn, tuy nhiên thời gian giao hàng lâu hơn dự kiến.'
                ELSE
                    'Sản phẩm ' || review_product.name || ' đáp ứng nhu cầu cơ bản nhưng phần hướng dẫn nên chi tiết hơn.'
            END
    END,
    TRUE,
    customer_order.delivered_at
        + INTERVAL '1 day'
        + (review_product.product_no * INTERVAL '7 minutes'),
    customer_order.delivered_at
        + INTERVAL '1 day'
        + (review_product.product_no * INTERVAL '7 minutes')
FROM demo_review_users review_user
CROSS JOIN demo_review_products review_product
JOIN orders customer_order
    ON customer_order.order_code =
        'DEMO-PRV-'
        || LPAD(review_user.id::TEXT, 3, '0')
        || '-'
        || LPAD(review_product.order_batch::TEXT, 2, '0')
CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN MOD(review_user.user_no * 7 + review_product.product_no * 3, 20) < 2 THEN 3
            WHEN MOD(review_user.user_no * 7 + review_product.product_no * 3, 20) < 7 THEN 4
            ELSE 5
        END AS rating
) generated_review
ON CONFLICT (user_id, product_id) DO NOTHING;

COMMIT;

-- Kết quả tổng quan.
SELECT
    (SELECT COUNT(*) FROM users WHERE enabled = TRUE AND role IN ('CUSTOMER', 'STAFF', 'ADMIN'))
        AS active_users,
    (SELECT COUNT(*) FROM products WHERE active = TRUE)
        AS active_products,
    (SELECT COUNT(*) FROM orders WHERE order_code LIKE 'DEMO-PRV-%')
        AS generated_orders,
    (
        SELECT COUNT(*)
        FROM order_items item
        JOIN orders customer_order ON customer_order.id = item.order_id
        WHERE customer_order.order_code LIKE 'DEMO-PRV-%'
    ) AS generated_order_items,
    (
        SELECT COUNT(*)
        FROM payments payment
        JOIN orders customer_order ON customer_order.id = payment.order_id
        WHERE customer_order.order_code LIKE 'DEMO-PRV-%'
          AND payment.status = 'PAID'
    ) AS paid_orders,
    (SELECT COUNT(*) FROM reviews) AS total_product_reviews;

-- Kết quả phải bằng 0: không còn tài khoản/sản phẩm nào thiếu đánh giá
-- hoặc thiếu lịch sử mua hàng đã giao.
SELECT COUNT(*) AS invalid_or_missing_review_pairs
FROM users review_user
CROSS JOIN products review_product
LEFT JOIN reviews review
    ON review.user_id = review_user.id
   AND review.product_id = review_product.id
WHERE review_user.enabled = TRUE
  AND review_user.role IN ('CUSTOMER', 'STAFF', 'ADMIN')
  AND review_product.active = TRUE
  AND (
      review.id IS NULL
      OR NOT EXISTS (
          SELECT 1
          FROM order_items item
          JOIN orders customer_order ON customer_order.id = item.order_id
          WHERE customer_order.user_id = review_user.id
            AND customer_order.status = 'DELIVERED'
            AND item.product_id = review_product.id
      )
  );

SELECT
    rating,
    COUNT(*) AS review_count
FROM reviews
WHERE approved = TRUE
GROUP BY rating
ORDER BY rating DESC;
