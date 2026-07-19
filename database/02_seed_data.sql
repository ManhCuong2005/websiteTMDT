INSERT INTO categories (name, slug, description, display_order, active)
VALUES
    ('Bút thử nước', 'but-thu-nuoc', 'Thiết bị kiểm tra nhanh chất lượng và độ dẫn điện của nguồn nước.', 1, TRUE),
    ('Lõi lọc nước', 'loi-loc-nuoc', 'Các loại lõi lọc thay thế dùng cho máy lọc nước gia đình.', 2, TRUE),
    ('Máy lọc nước', 'may-loc-nuoc', 'Máy lọc nước RO và công nghệ lọc hiện đại cho gia đình, văn phòng.', 3, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, low_stock_threshold, unit, image_url, active, featured)
VALUES
    ((SELECT id FROM categories WHERE slug='but-thu-nuoc'), 'Bút đo TDS nước sạch TDS-3', 'but-do-tds-3', 'BUT-TDS-003', 'Đo nhanh tổng chất rắn hòa tan trong nước, màn hình LCD dễ đọc.', 'Bút TDS-3 nhỏ gọn, phù hợp kiểm tra nước máy, nước giếng và chất lượng nước sau lọc. Thiết bị tự động bù nhiệt và lưu kết quả đo.', 159000, 199000, 48, 8, 'cái', NULL, TRUE, TRUE),
    ((SELECT id FROM categories WHERE slug='but-thu-nuoc'), 'Bút đo pH kỹ thuật số PH-02', 'but-do-ph-02', 'BUT-PH-002', 'Kiểm tra độ pH của nước với độ phân giải 0.01.', 'Bút đo pH điện tử dành cho gia đình, hồ cá và kiểm tra nguồn nước. Có thể hiệu chuẩn lại bằng dung dịch chuẩn.', 229000, 279000, 35, 6, 'cái', NULL, TRUE, TRUE),
    ((SELECT id FROM categories WHERE slug='but-thu-nuoc'), 'Bút đo EC và nhiệt độ EC-1', 'but-do-ec-1', 'BUT-EC-001', 'Đo độ dẫn điện EC và nhiệt độ nước trong vài giây.', 'Thiết bị đo EC có nắp bảo vệ đầu dò, phù hợp đánh giá nhanh hàm lượng khoáng trong nước.', 189000, NULL, 24, 5, 'cái', NULL, TRUE, FALSE),
    ((SELECT id FROM categories WHERE slug='loi-loc-nuoc'), 'Lõi lọc PP 5 Micron số 1', 'loi-loc-pp-5-micron-so-1', 'LOI-PP-001', 'Loại bỏ cặn bẩn, rỉ sét và tạp chất kích thước lớn.', 'Lõi PP 5 micron tiêu chuẩn 10 inch, dùng được cho nhiều dòng máy lọc nước RO phổ biến.', 65000, 79000, 120, 20, 'lõi', NULL, TRUE, TRUE),
    ((SELECT id FROM categories WHERE slug='loi-loc-nuoc'), 'Lõi than hoạt tính UDF số 2', 'loi-than-hoat-tinh-udf-so-2', 'LOI-UDF-002', 'Hấp phụ clo, mùi và các chất hữu cơ trong nước.', 'Lõi than hoạt tính dạng hạt giúp cải thiện mùi vị nước và bảo vệ màng RO phía sau.', 115000, 139000, 85, 15, 'lõi', NULL, TRUE, TRUE),
    ((SELECT id FROM categories WHERE slug='loi-loc-nuoc'), 'Lõi CTO than ép số 3', 'loi-cto-than-ep-so-3', 'LOI-CTO-003', 'Lọc sâu mùi, màu và các hợp chất hữu cơ còn lại.', 'Lõi CTO than ép mật độ cao, kích thước tiêu chuẩn, tuổi thọ khuyến nghị 6-9 tháng.', 135000, 159000, 72, 12, 'lõi', NULL, TRUE, FALSE),
    ((SELECT id FROM categories WHERE slug='loi-loc-nuoc'), 'Màng lọc RO 100 GPD', 'mang-loc-ro-100-gpd', 'LOI-RO-100', 'Màng RO công suất 100 GPD, lọc ion kim loại và vi sinh vật.', 'Màng lọc RO dùng cho máy gia đình, cung cấp lưu lượng ổn định và chất lượng nước đầu ra tốt.', 590000, 690000, 30, 6, 'màng', NULL, TRUE, TRUE),
    ((SELECT id FROM categories WHERE slug='may-loc-nuoc'), 'Máy lọc nước RO 9 lõi AquaHome A9', 'may-loc-nuoc-ro-9-loi-aquahome-a9', 'MAY-AH-A9', 'Máy lọc RO 9 lõi, tủ đứng gọn đẹp, phù hợp gia đình 4-6 người.', 'Hệ thống 9 cấp lọc gồm màng RO 100 GPD và các lõi chức năng bổ sung khoáng. Tích hợp bình áp và cảnh báo thay lõi cơ bản.', 5790000, 6490000, 14, 3, 'máy', NULL, TRUE, TRUE),
    ((SELECT id FROM categories WHERE slug='may-loc-nuoc'), 'Máy lọc nước để gầm EcoPure E7', 'may-loc-nuoc-de-gam-ecopure-e7', 'MAY-EP-E7', 'Thiết kế để gầm bếp, tiết kiệm không gian, 7 cấp lọc.', 'Máy lọc nước để gầm có công suất lọc 15 lít/giờ, vòi inox riêng và hệ thống cút nối nhanh.', 4290000, 4890000, 9, 2, 'máy', NULL, TRUE, TRUE),
    ((SELECT id FROM categories WHERE slug='may-loc-nuoc'), 'Máy lọc nước nóng lạnh PureMax P10', 'may-loc-nuoc-nong-lanh-puremax-p10', 'MAY-PM-P10', 'Tích hợp nước nóng, lạnh và thường với hệ thống lọc RO 10 lõi.', 'Sản phẩm phù hợp gia đình và văn phòng nhỏ, có khóa an toàn nước nóng và bình chứa riêng biệt.', 10990000, 12490000, 6, 2, 'máy', NULL, TRUE, FALSE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO coupons (code, name, type, value, min_order_amount, max_discount, usage_limit, used_count, active)
VALUES
    ('CHAOMUNG', 'Ưu đãi chào mừng khách hàng mới', 'PERCENT', 10, 300000, 200000, 500, 0, TRUE),
    ('GIAM50K', 'Giảm trực tiếp 50.000đ', 'FIXED', 50000, 500000, NULL, 300, 0, TRUE),
    ('LOILOC15', 'Giảm 15% đơn hàng từ 400.000đ', 'PERCENT', 15, 400000, 150000, 200, 0, TRUE)
ON CONFLICT (code) DO NOTHING;
