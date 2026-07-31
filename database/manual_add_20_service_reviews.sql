-- Thêm 20 lịch dịch vụ đã hoàn thành và 20 đánh giá tương ứng.
-- Script sử dụng 5 khách hàng và 2 nhân viên đang có trong database.
-- Có thể chạy lại an toàn: lịch có cùng mã [DEMO-SERVICE-REVIEW-xx]
-- không bị tạo lại, đánh giá tương ứng chỉ được cập nhật.

BEGIN;

CREATE TEMP TABLE demo_service_review_seed (
    seed_no             INTEGER PRIMARY KEY,
    customer_email      VARCHAR(190) NOT NULL,
    staff_email         VARCHAR(190) NOT NULL,
    service_type        VARCHAR(80) NOT NULL,
    address             VARCHAR(255) NOT NULL,
    request_note        VARCHAR(1000) NOT NULL UNIQUE,
    staff_result_note   VARCHAR(1000) NOT NULL,
    rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_content      VARCHAR(1000) NOT NULL,
    days_ago            INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO demo_service_review_seed (
    seed_no,
    customer_email,
    staff_email,
    service_type,
    address,
    request_note,
    staff_result_note,
    rating,
    review_content,
    days_ago
)
VALUES
    (
        1,
        'a@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Lắp đặt máy lọc',
        '25 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-01] Lắp máy lọc nước mới cho gia đình.',
        'Đã lắp đặt hoàn chỉnh, kiểm tra áp lực nước và hướng dẫn khách sử dụng.',
        5,
        'Kỹ thuật viên đến đúng giờ, lắp đặt gọn gàng và hướng dẫn sử dụng rất dễ hiểu.',
        1
    ),
    (
        2,
        'abc123@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Thay lõi lọc',
        '118 Lê Duẩn, Thanh Khê, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-02] Thay bộ lõi lọc định kỳ.',
        'Đã thay lõi PP, GAC và CTO; xả lõi, kiểm tra chất lượng nước đầu ra.',
        5,
        'Nhân viên tư vấn đúng loại lõi cần thay, thao tác nhanh và khu vực làm việc rất sạch.',
        2
    ),
    (
        3,
        'haccongtu2205@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Kiểm tra nguồn nước',
        '42 Trần Phú, Hải Châu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-03] Kiểm tra nguồn nước sinh hoạt.',
        'Đã đo TDS, pH và kiểm tra mùi; gửi kết quả cùng khuyến nghị cho khách.',
        5,
        'Kết quả được giải thích rõ ràng, có số liệu cụ thể nên gia đình tôi rất yên tâm.',
        3
    ),
    (
        4,
        'manhcuongblack2205@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Sửa chữa máy lọc',
        '76 Hoàng Diệu, Hải Châu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-04] Máy lọc chạy yếu và phát tiếng ồn.',
        'Đã vệ sinh van, siết lại đầu nối và thay bơm tăng áp; máy vận hành ổn định.',
        4,
        'Máy đã chạy êm và nước ra mạnh hơn. Thời gian xử lý hơi lâu nhưng kết quả tốt.',
        5
    ),
    (
        5,
        'vancam2205@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Bảo trì định kỳ',
        '15 Hàm Nghi, Thanh Khê, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-05] Bảo trì máy lọc nước định kỳ.',
        'Đã vệ sinh hệ thống, kiểm tra lõi, đường ống và áp suất bình chứa.',
        5,
        'Quy trình bảo trì chuyên nghiệp, nhân viên chủ động nhắc lịch và kiểm tra rất kỹ.',
        7
    ),
    (
        6,
        'a@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Thay lõi lọc',
        '210 Điện Biên Phủ, Thanh Khê, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-06] Thay lõi thô và kiểm tra màng RO.',
        'Đã thay ba lõi thô, đo nước trước và sau lọc; màng RO vẫn hoạt động tốt.',
        4,
        'Dịch vụ tốt, báo giá rõ trước khi làm. Nếu có thêm tin nhắn nhắc lịch sớm hơn sẽ hoàn hảo.',
        10
    ),
    (
        7,
        'abc123@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Lắp đặt máy lọc',
        '33 Nguyễn Tri Phương, Thanh Khê, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-07] Lắp máy lọc nước dưới bồn rửa.',
        'Đã lắp máy âm tủ, đi lại đường nước và kiểm tra toàn bộ vị trí kết nối.',
        5,
        'Lắp đặt thẩm mỹ, đường dây và ống nước được sắp xếp gọn, không chiếm nhiều diện tích.',
        13
    ),
    (
        8,
        'haccongtu2205@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Sửa chữa máy lọc',
        '91 Ngô Quyền, Sơn Trà, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-08] Máy lọc không tự ngắt.',
        'Đã thay van áp cao và kiểm tra rò rỉ; máy tự ngắt bình thường.',
        5,
        'Tìm đúng nguyên nhân và sửa dứt điểm trong một lần. Nhân viên thân thiện, nhiệt tình.',
        17
    ),
    (
        9,
        'manhcuongblack2205@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Kiểm tra nguồn nước',
        '128 Phạm Văn Đồng, Sơn Trà, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-09] Kiểm tra nước sau lọc có mùi lạ.',
        'Đã kiểm tra chất lượng nước, vệ sinh bình áp và đề xuất thay lõi than hậu.',
        4,
        'Kiểm tra kỹ và tư vấn hợp lý, không yêu cầu thay những linh kiện chưa cần thiết.',
        21
    ),
    (
        10,
        'vancam2205@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Bảo trì định kỳ',
        '54 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-10] Vệ sinh và bảo trì hệ thống lọc.',
        'Đã vệ sinh cốc lọc, kiểm tra bơm, van và thay các gioăng bị lão hóa.',
        5,
        'Làm việc cẩn thận, có chụp lại tình trạng trước và sau khi bảo trì cho khách kiểm tra.',
        26
    ),
    (
        11,
        'a@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Sửa chữa máy lọc',
        '19 Duy Tân, Hải Châu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-11] Máy lọc bị rò nước tại cốc lọc.',
        'Đã thay gioăng cốc lọc, vệ sinh ren và kiểm tra kín nước toàn hệ thống.',
        5,
        'Đặt lịch buổi sáng và được hỗ trợ ngay trong ngày. Vấn đề rò nước đã được xử lý hoàn toàn.',
        32
    ),
    (
        12,
        'abc123@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Thay lõi lọc',
        '62 Nguyễn Hữu Thọ, Hải Châu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-12] Thay màng RO và lõi khoáng.',
        'Đã thay màng RO, lõi khoáng; xả hệ thống và đo chỉ số nước sau lọc.',
        3,
        'Chất lượng sau thay lõi tốt nhưng kỹ thuật viên đến trễ hơn lịch hẹn khoảng ba mươi phút.',
        39
    ),
    (
        13,
        'haccongtu2205@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Lắp đặt máy lọc',
        '147 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-13] Lắp máy lọc cho căn hộ mới.',
        'Đã khảo sát vị trí, lắp máy và bàn giao đầy đủ phụ kiện cùng hướng dẫn bảo hành.',
        5,
        'Đội ngũ hỗ trợ từ khâu chọn máy đến lắp đặt đều chu đáo, trải nghiệm rất chuyên nghiệp.',
        47
    ),
    (
        14,
        'manhcuongblack2205@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Bảo trì định kỳ',
        '38 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-14] Kiểm tra máy sau sáu tháng sử dụng.',
        'Đã kiểm tra tổng thể, vệ sinh lõi và hiệu chỉnh áp lực nước đầu vào.',
        4,
        'Nhân viên làm việc kỹ, giải đáp đầy đủ các câu hỏi và chi phí đúng như báo trước.',
        55
    ),
    (
        15,
        'vancam2205@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Kiểm tra nguồn nước',
        '80 Âu Cơ, Liên Chiểu, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-15] Đo và tư vấn chất lượng nước giếng.',
        'Đã lấy mẫu, đo nhanh các chỉ số và đề xuất cấu hình lọc phù hợp nguồn nước.',
        5,
        'Tư vấn có cơ sở, dễ hiểu và không gây áp lực mua hàng. Tôi đánh giá cao sự minh bạch.',
        64
    ),
    (
        16,
        'a@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Bảo trì định kỳ',
        '22 Châu Thị Vĩnh Tế, Ngũ Hành Sơn, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-16] Bảo trì máy lọc tại nhà.',
        'Đã vệ sinh, kiểm tra điện, bơm và đường nước; hệ thống hoạt động bình thường.',
        5,
        'Thao tác nhanh nhưng vẫn kiểm tra đầy đủ. Sau bảo trì máy chạy êm hơn rõ rệt.',
        76
    ),
    (
        17,
        'abc123@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Sửa chữa máy lọc',
        '105 Lê Văn Hiến, Ngũ Hành Sơn, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-17] Máy lọc không ra nước tinh khiết.',
        'Đã thay van điện từ hỏng, thông đường nước và kiểm tra lại bơm.',
        4,
        'Sửa đúng lỗi, máy hoạt động ổn định. Phần liên hệ xác nhận lịch có thể nhanh hơn một chút.',
        89
    ),
    (
        18,
        'haccongtu2205@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Thay lõi lọc',
        '51 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-18] Thay trọn bộ lõi lọc gia đình.',
        'Đã thay lõi theo đúng model, vệ sinh máy và bàn giao lõi cũ cho khách kiểm tra.',
        5,
        'Sản phẩm có tem rõ ràng, nhân viên cho kiểm tra lõi trước khi thay nên rất đáng tin cậy.',
        103
    ),
    (
        19,
        'manhcuongblack2205@gmail.com',
        'ngoitrongcautieu@gmail.com',
        'Lắp đặt máy lọc',
        '73 Cách Mạng Tháng Tám, Cẩm Lệ, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-19] Di dời và lắp lại máy lọc.',
        'Đã tháo, vận chuyển vị trí ngắn, lắp lại đường nước và kiểm tra vận hành.',
        3,
        'Công việc hoàn thành tốt nhưng thời gian thi công lâu hơn dự kiến do thiếu một phụ kiện.',
        121
    ),
    (
        20,
        'vancam2205@gmail.com',
        'dadinhviruscorona@gmail.com',
        'Kiểm tra nguồn nước',
        '36 Ông Ích Đường, Cẩm Lệ, Đà Nẵng',
        '[DEMO-SERVICE-REVIEW-20] Kiểm tra nước máy trước khi chọn thiết bị lọc.',
        'Đã đo các chỉ số cơ bản, kiểm tra độ trong và tư vấn công suất máy phù hợp.',
        2,
        'Kết quả kiểm tra rõ ràng nhưng tôi phải chờ khá lâu mới nhận được bản tư vấn chi tiết.',
        145
    );

DO $$
DECLARE
    missing_customers INTEGER;
    missing_staff     INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO missing_customers
    FROM (
        SELECT DISTINCT seed.customer_email
        FROM demo_service_review_seed seed
        LEFT JOIN users customer
            ON customer.email = seed.customer_email
           AND customer.role = 'CUSTOMER'
           AND customer.enabled = TRUE
        WHERE customer.id IS NULL
    ) missing;

    SELECT COUNT(*)
    INTO missing_staff
    FROM (
        SELECT DISTINCT seed.staff_email
        FROM demo_service_review_seed seed
        LEFT JOIN users staff
            ON staff.email = seed.staff_email
           AND staff.role = 'STAFF'
           AND staff.enabled = TRUE
        WHERE staff.id IS NULL
    ) missing;

    IF missing_customers > 0 THEN
        RAISE EXCEPTION 'Thiếu % tài khoản CUSTOMER cần thiết.', missing_customers;
    END IF;

    IF missing_staff > 0 THEN
        RAISE EXCEPTION 'Thiếu % tài khoản STAFF cần thiết.', missing_staff;
    END IF;
END
$$;

INSERT INTO service_requests (
    user_id,
    assigned_staff_id,
    full_name,
    phone,
    address,
    service_type,
    preferred_time,
    note,
    status,
    admin_note,
    staff_result_note,
    complaint,
    contacted_at,
    staff_contacted_at,
    assigned_at,
    staff_completed_at,
    customer_confirmed_at,
    completed_at,
    created_at,
    updated_at
)
SELECT
    customer.id,
    staff.id,
    customer.full_name,
    COALESCE(NULLIF(customer.phone, ''), '0905000000'),
    seed.address,
    seed.service_type,
    TO_CHAR(
        CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '5 hours',
        'DD/MM/YYYY HH24:MI'
    ),
    seed.request_note,
    'COMPLETED',
    'Đã xác nhận lịch và giao kỹ thuật viên phụ trách.',
    seed.staff_result_note,
    NULL,
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '2 days 20 hours',
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '1 day',
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '2 days',
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '4 hours',
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day') - INTERVAL '3 days',
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day')
FROM demo_service_review_seed seed
JOIN users customer
    ON customer.email = seed.customer_email
   AND customer.role = 'CUSTOMER'
JOIN users staff
    ON staff.email = seed.staff_email
   AND staff.role = 'STAFF'
WHERE NOT EXISTS (
    SELECT 1
    FROM service_requests existing
    WHERE existing.note = seed.request_note
);

INSERT INTO service_reviews (
    service_request_id,
    user_id,
    rating,
    content,
    created_at,
    updated_at
)
SELECT
    request.id,
    request.user_id,
    seed.rating,
    seed.review_content,
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day'),
    CURRENT_TIMESTAMP - (seed.days_ago * INTERVAL '1 day')
FROM demo_service_review_seed seed
JOIN service_requests request
    ON request.note = seed.request_note
   AND request.status = 'COMPLETED'
JOIN users customer
    ON customer.id = request.user_id
   AND customer.email = seed.customer_email
ON CONFLICT (service_request_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    rating = EXCLUDED.rating,
    content = EXCLUDED.content,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- Kiểm tra 20 dữ liệu vừa tạo.
SELECT
    review.id,
    customer.full_name,
    customer.email,
    request.service_type,
    request.status,
    review.rating,
    review.content,
    review.created_at
FROM service_reviews review
JOIN service_requests request ON request.id = review.service_request_id
JOIN users customer ON customer.id = review.user_id
WHERE request.note LIKE '[DEMO-SERVICE-REVIEW-%'
ORDER BY review.created_at DESC;

-- Thống kê tổng quan sau khi chạy.
SELECT
    COUNT(*) AS total_service_reviews,
    ROUND(AVG(rating), 2) AS average_rating
FROM service_reviews;
