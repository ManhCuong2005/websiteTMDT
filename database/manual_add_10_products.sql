-- Chạy thủ công trên database banhang_db.
-- Có thể chạy lại: sản phẩm cùng slug sẽ được cập nhật, không bị nhân đôi.

BEGIN;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM categories
        WHERE slug IN ('but-thu-nuoc', 'loi-loc-nuoc', 'may-loc-nuoc')
          AND active = TRUE
    ) <> 3 THEN
        RAISE EXCEPTION
            'Thiếu danh mục cần thiết. Hãy chạy migration/khởi động backend trước.';
    END IF;
END
$$;

INSERT INTO products (
    category_id,
    name,
    slug,
    sku,
    short_description,
    description,
    price,
    compare_at_price,
    stock_quantity,
    low_stock_threshold,
    unit,
    image_url,
    active,
    featured,
    created_at,
    updated_at
)
SELECT
    c.id,
    p.name,
    p.slug,
    p.sku,
    p.short_description,
    p.description,
    p.price,
    p.compare_at_price,
    p.stock_quantity,
    p.low_stock_threshold,
    p.unit,
    NULL,
    TRUE,
    p.featured,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    VALUES
        (
            'but-thu-nuoc',
            'Bút đo TDS chống nước TDS-Pro',
            'but-do-tds-chong-nuoc-tds-pro',
            'BUT-TDS-PRO',
            'Đo nhanh TDS, EC và nhiệt độ với màn hình LCD có đèn nền.',
            'Thiết bị đạt chuẩn chống nước IP67, tự động bù nhiệt, lưu kết quả đo và cảnh báo khi nồng độ chất rắn hòa tan vượt ngưỡng. Phù hợp kiểm tra nước sinh hoạt, nước sau lọc và hồ thủy sinh.',
            329000::numeric,
            389000::numeric,
            42,
            8,
            'cái',
            TRUE
        ),
        (
            'but-thu-nuoc',
            'Bút đo pH tự động ATC PH-05',
            'but-do-ph-tu-dong-atc-ph-05',
            'BUT-PH-005',
            'Đo pH chính xác, hiệu chuẩn tự động ba điểm và có bù nhiệt ATC.',
            'Bút đo pH PH-05 có độ phân giải 0.01, màn hình hiển thị kép và chức năng tự tắt. Sản phẩm thích hợp kiểm tra nước uống, bể cá, dung dịch thủy canh và nguồn nước gia đình.',
            459000::numeric,
            529000::numeric,
            30,
            6,
            'cái',
            TRUE
        ),
        (
            'but-thu-nuoc',
            'Máy đo chất lượng nước 5 trong 1 WQ-500',
            'may-do-chat-luong-nuoc-5-trong-1-wq-500',
            'MAY-DO-WQ500',
            'Đo pH, TDS, EC, ORP và nhiệt độ trong cùng một thiết bị.',
            'Thiết bị đo đa năng WQ-500 giúp đánh giá nhanh nhiều chỉ số quan trọng của nguồn nước. Máy có màn hình màu, bộ nhớ kết quả và đầu dò có thể thay thế, phù hợp gia đình và kỹ thuật viên.',
            1290000::numeric,
            1490000::numeric,
            18,
            4,
            'bộ',
            TRUE
        ),
        (
            'loi-loc-nuoc',
            'Lõi lọc PP 1 Micron cao cấp',
            'loi-loc-pp-1-micron-cao-cap',
            'LOI-PP-1M',
            'Giữ lại cặn mịn, bùn đất và rỉ sét có kích thước từ 1 micron.',
            'Lõi PP ép nhiệt mật độ cao, kích thước tiêu chuẩn 10 inch. Sản phẩm phù hợp làm lõi lọc thô cho máy RO gia đình và nên thay sau 3 đến 6 tháng tùy chất lượng nguồn nước.',
            89000::numeric,
            109000::numeric,
            150,
            25,
            'lõi',
            FALSE
        ),
        (
            'loi-loc-nuoc',
            'Lõi than hoạt tính GAC Coconut',
            'loi-than-hoat-tinh-gac-coconut',
            'LOI-GAC-COCO',
            'Than gáo dừa hoạt tính giúp hấp phụ clo, mùi và chất hữu cơ.',
            'Lõi GAC sử dụng than hoạt tính gáo dừa có khả năng hấp phụ tốt, cải thiện mùi vị nước và bảo vệ màng RO. Kích thước tiêu chuẩn, tương thích với nhiều dòng máy lọc nước.',
            149000::numeric,
            179000::numeric,
            96,
            15,
            'lõi',
            TRUE
        ),
        (
            'loi-loc-nuoc',
            'Lõi khoáng đá Maifan Mineral Plus',
            'loi-khoang-da-maifan-mineral-plus',
            'LOI-MINERAL-PLUS',
            'Bổ sung khoáng chất và hỗ trợ cân bằng vị ngọt tự nhiên của nước.',
            'Lõi chức năng Mineral Plus sử dụng hạt khoáng Maifan, hỗ trợ bổ sung khoáng vi lượng sau màng RO và làm nước dễ uống hơn. Khuyến nghị thay lõi sau 12 đến 18 tháng.',
            279000::numeric,
            329000::numeric,
            64,
            10,
            'lõi',
            FALSE
        ),
        (
            'loi-loc-nuoc',
            'Màng RO DOW Filmtec 75 GPD',
            'mang-ro-dow-filmtec-75-gpd',
            'LOI-RO-DOW75',
            'Màng lọc RO chính hãng, công suất 75 GPD cho gia đình.',
            'Màng RO DOW Filmtec giúp loại bỏ phần lớn ion kim loại nặng, vi khuẩn và tạp chất hòa tan. Sản phẩm cho lưu lượng ổn định, phù hợp máy lọc nước gia đình từ 7 đến 10 lõi.',
            890000::numeric,
            990000::numeric,
            28,
            6,
            'màng',
            TRUE
        ),
        (
            'may-loc-nuoc',
            'Máy lọc nước RO AquaHome A10',
            'may-loc-nuoc-ro-aquahome-a10',
            'MAY-AH-A10',
            'Máy RO 10 lõi, thiết kế tủ đứng hiện đại cho gia đình 4 đến 6 người.',
            'AquaHome A10 trang bị màng RO 100 GPD, hệ thống lõi chức năng bổ sung khoáng và cảnh báo thay lõi. Vỏ tủ kính cường lực, vận hành êm và tiết kiệm điện.',
            6990000::numeric,
            7790000::numeric,
            15,
            3,
            'máy',
            TRUE
        ),
        (
            'may-loc-nuoc',
            'Máy lọc nước Hydrogen IonCare H12',
            'may-loc-nuoc-hydrogen-ioncare-h12',
            'MAY-IC-H12',
            'Hệ thống lọc 12 cấp tích hợp lõi tạo Hydrogen và khoáng kiềm.',
            'IonCare H12 sử dụng màng RO hiệu suất cao, lõi Hydrogen hỗ trợ tạo nước giàu khoáng và màn hình theo dõi hoạt động. Thiết kế sang trọng phù hợp nhà ở hiện đại.',
            12490000::numeric,
            13990000::numeric,
            8,
            2,
            'máy',
            TRUE
        ),
        (
            'may-loc-nuoc',
            'Máy lọc nước bán công nghiệp MP-30L',
            'may-loc-nuoc-ban-cong-nghiep-mp-30l',
            'MAY-MP-30L',
            'Công suất lọc 30 lít mỗi giờ cho văn phòng, trường học và cửa hàng.',
            'MP-30L trang bị bơm áp lực cao, màng RO công suất lớn và bình chứa dung tích cao. Hệ thống phù hợp nơi có nhu cầu sử dụng nước sạch liên tục trong ngày.',
            15900000::numeric,
            17500000::numeric,
            5,
            1,
            'bộ',
            FALSE
        )
) AS p (
    category_slug,
    name,
    slug,
    sku,
    short_description,
    description,
    price,
    compare_at_price,
    stock_quantity,
    low_stock_threshold,
    unit,
    featured
)
JOIN categories c ON c.slug = p.category_slug
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    stock_quantity = EXCLUDED.stock_quantity,
    low_stock_threshold = EXCLUDED.low_stock_threshold,
    unit = EXCLUDED.unit,
    active = EXCLUDED.active,
    featured = EXCLUDED.featured,
    updated_at = CURRENT_TIMESTAMP
RETURNING id, name, sku, price, stock_quantity, featured;

COMMIT;

-- Kiểm tra kết quả sau khi chèn:
SELECT
    p.id,
    c.name AS category_name,
    p.name,
    p.sku,
    p.price,
    p.stock_quantity,
    p.featured,
    p.active
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.slug IN (
    'but-do-tds-chong-nuoc-tds-pro',
    'but-do-ph-tu-dong-atc-ph-05',
    'may-do-chat-luong-nuoc-5-trong-1-wq-500',
    'loi-loc-pp-1-micron-cao-cap',
    'loi-than-hoat-tinh-gac-coconut',
    'loi-khoang-da-maifan-mineral-plus',
    'mang-ro-dow-filmtec-75-gpd',
    'may-loc-nuoc-ro-aquahome-a10',
    'may-loc-nuoc-hydrogen-ioncare-h12',
    'may-loc-nuoc-ban-cong-nghiep-mp-30l'
)
ORDER BY c.display_order, p.id;
