import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);
const STORAGE_KEY = "banhang_language";

/*
 * The application originally shipped with Vietnamese text directly in the
 * components. Keeping this dictionary at the presentation boundary lets us
 * add complete English support without changing any form handler, route or API
 * payload. Longer phrases are translated before short reusable labels.
 */
const translations = {
  "NGUỒN NƯỚC AN TÂM · DỊCH VỤ TẬN NHÀ": "SAFE WATER · AT-HOME SERVICE",
  "Minh Phát giúp bạn chọn đúng bút thử nước, lõi lọc, máy lọc và đặt thợ kiểm tra, lắp đặt, bảo trì ngay tại nhà.":
    "Minh Phat helps you choose the right testers, filters and purifiers, with at-home inspection, installation and maintenance.",
  "Kiểm tra định kỳ giúp máy hoạt động ổn định và đảm bảo chất lượng nước đầu ra. Lõi thô thường cần thay sau 3-9 tháng tùy nguồn nước và tần suất sử dụng.":
    "Regular checks keep your purifier running reliably and maintain output water quality. Pre-filters usually need replacing every 3–9 months, depending on the water source and usage.",
  "Gửi yêu cầu kiểm tra, sửa chữa, lắp đặt hoặc bảo trì. Admin sẽ thấy yêu cầu này trong màn hình quản trị.":
    "Send an inspection, repair, installation or maintenance request. It will appear in the admin workspace.",
  "Đã gửi yêu cầu. Minh Phát sẽ liên hệ xác nhận lịch trong thời gian sớm nhất.":
    "Your request has been sent. Minh Phat will contact you shortly to confirm the appointment.",
  "Thông tin tài khoản và địa chỉ mặc định sẽ được điền sẵn nếu có.":
    "Your account details and default address will be filled in automatically when available.",
  "Bạn cần đăng nhập để hệ thống lưu yêu cầu và admin xử lý.":
    "Please sign in so the system can save your request for the service team.",
  "Phù hợp khi bạn cần lắp máy mới, thay lõi lọc, kiểm tra chất lượng nước hoặc xử lý máy chảy yếu, rò rỉ.":
    "Ideal for new installations, filter replacement, water testing, weak flow or leak repair.",
  "Kỹ thuật viên đến tận nhà, kiểm tra vị trí và lắp đặt gọn gàng.":
    "A technician visits your home, checks the location and installs everything neatly.",
  "Đo nhanh TDS, tư vấn lõi lọc phù hợp với tình trạng nước thực tế.":
    "Quick TDS testing and filter advice tailored to your actual water conditions.",
  "Nhắc lịch thay lõi, vệ sinh máy và kiểm tra rò rỉ để dùng bền hơn.":
    "Filter reminders, cleaning and leak checks help your system last longer.",
  "Giải pháp kiểm tra, lắp đặt và bảo trì máy lọc nước đáng tin cậy cho mọi gia đình Việt.":
    "Reliable water testing, purifier installation and maintenance for every home.",
  "Chọn đúng thiết bị kiểm tra, lõi thay thế và máy lọc cho nhu cầu của bạn.":
    "Choose the right tester, replacement filter and purifier for your needs.",
  "Bạn thanh toán tiền mặt khi nhận và kiểm tra kiện hàng.":
    "Pay in cash after receiving and checking your parcel.",
  "Bằng việc đặt hàng, bạn đồng ý với chính sách mua hàng của website.":
    "By placing this order, you agree to the website's purchase policy.",
  "Mã giảm giá sẽ được áp dụng ở bước thanh toán.":
    "Coupon codes can be applied during checkout.",
  "Khám phá các sản phẩm chăm sóc nguồn nước của chúng tôi.":
    "Explore our clean-water care products.",
  "Giỏ hàng được lưu theo tài khoản của bạn.":
    "Your cart is securely saved to your account.",
  "Đăng nhập để quản lý giỏ hàng, đơn mua và địa chỉ giao hàng.":
    "Sign in to manage your cart, orders and delivery addresses.",
  "Theo dõi đơn hàng và lưu thông tin nhận hàng tiện lợi hơn.":
    "Track orders and save delivery details for a faster checkout.",
  "Mật khẩu tối thiểu 6 ký tự. Không sử dụng mật khẩu quan trọng của bạn.":
    "Use at least 6 characters and do not reuse an important password.",
  "Vui lòng nhập email hợp lệ trước khi xác thực gương mặt.":
    "Enter a valid email before using face verification.",
  "Giữ khuôn mặt trong khung, đủ sáng và không đeo khẩu trang.":
    "Keep your face inside the frame, in good light and without a mask.",
  "Bạn cần cho phép sử dụng camera để tiếp tục.":
    "Allow camera access to continue.",
  "Gương mặt đã được bảo vệ và sẵn sàng để đăng nhập.":
    "Face sign-in is protected and ready to use.",
  "Đăng ký bằng camera sau khi đã đăng nhập tài khoản.":
    "Enroll with your camera after signing in to your account.",
  "Chọn ngôn ngữ hiển thị cho toàn bộ website.":
    "Choose the display language for the entire website.",
  "Nhấn để đăng xuất khỏi tài khoản hiện tại.":
    "Sign out of the current account.",
  "Bạn có chắc chắn muốn đăng xuất không?":
    "Are you sure you want to sign out?",
  "Bạn chắc chắn muốn hủy đơn hàng này?":
    "Are you sure you want to cancel this order?",
  "Bạn có chắc chắn muốn hủy đơn hàng này không?\nHành động này không thể hoàn tác.":
    "Are you sure you want to cancel this order?\nThis action cannot be undone.",
  "Bạn chắc chắn muốn hủy đơn": "Are you sure you want to cancel order",
  "Xóa dữ liệu đăng nhập bằng gương mặt?": "Delete your face sign-in data?",
  "Xóa sản phẩm khỏi giỏ hàng?": "Remove this product from your cart?",
  "Ẩn sản phẩm này khỏi cửa hàng?": "Hide this product from the store?",
  "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP":
    "Only JPG, PNG or WEBP images are accepted",
  "Hình ảnh không được vượt quá 5 MB": "Images must not exceed 5 MB",
  "Kỹ thuật viên kiểm tra tình trạng thực tế trước khi xử lý.":
    "A technician checks the actual condition before starting work.",
  "Gợi ý lõi lọc và thiết bị phù hợp với nhu cầu gia đình.":
    "Get filter and equipment recommendations for your household.",
  "Admin cập nhật trạng thái: đã liên hệ, đã hẹn lịch, hoàn tất.":
    "Track status updates from contacted and scheduled through completed.",
  "Việc được giao cũ nhất sẽ nằm trên cùng để xử lý theo đúng thứ tự.":
    "The oldest assigned task appears first for timely handling.",
  "Việc mới hoàn thành sẽ nằm trên cùng.":
    "The most recently completed task appears first.",
  "Khi bạn hoàn thành công việc, lịch sử sẽ xuất hiện ở đây.":
    "Completed task history will appear here.",
  "Các việc mới được admin giao sẽ xuất hiện tại đây.":
    "New tasks assigned by an admin will appear here.",
  "chỉ hiển thị các yêu cầu được giao cho bạn.":
    "only requests assigned to you are shown.",
  "Chưa có yêu cầu phù hợp với bộ lọc hiện tại.":
    "No requests match the current filters.",
  "Chọn nhân viên role STAFF để giao việc":
    "Select a staff member to assign this task",
  "Bạn không thể tự khóa tài khoản đang đăng nhập.":
    "You cannot lock the account you are currently using.",
  "Bạn không thể tự hạ vai trò quản trị của chính mình.":
    "You cannot remove your own admin role.",
  "Thông tin chi tiết đang được cập nhật.":
    "Detailed information is being updated.",
  "Đăng nhập để kiểm tra quyền đánh giá sản phẩm này.":
    "Sign in to check whether you can review this product.",
  "Chia sẻ trải nghiệm sau khi sử dụng...":
    "Share your experience after using this product...",
  "Tồn kho cập nhật theo hệ thống": "Stock is updated by the system",
  "Đang kiểm tra quyền đánh giá...": "Checking review eligibility...",
  "Thử đổi từ khóa hoặc danh mục khác.": "Try another keyword or category.",
  "Thanh toán khi nhận hàng (COD)": "Cash on delivery (COD)",
  "Thời gian nhận hàng, lưu ý giao hàng...":
    "Preferred delivery time or notes...",
  "Số nhà, phường/xã, quận/huyện, tỉnh/thành":
    "Street, ward, district, province",
  "Mô tả tình trạng máy, nguồn nước hoặc yêu cầu thêm...":
    "Describe the purifier, water condition or any additional request...",
  "Ví dụ: Đã thay lõi số 1, khách hẹn kiểm tra lại sau 3 tháng...":
    "Example: Replaced filter 1; customer requested another check in 3 months...",
  "Ví dụ: Đã gọi khách, hẹn 9h sáng thứ 7...":
    "Example: Called customer; appointment at 9:00 Saturday...",

  "CHÀO MỪNG TRỞ LẠI": "WELCOME BACK",
  "TÀI KHOẢN CỦA TÔI": "MY ACCOUNT",
  "TÀI KHOẢN HỆ THỐNG": "SYSTEM ACCOUNTS",
  "THÀNH VIÊN MỚI": "NEW MEMBER",
  "THANH VIEN MOI": "NEW MEMBER",
  "DANH MỤC NỔI BẬT": "FEATURED CATEGORIES",
  "PHÂN NHÓM SẢN PHẨM": "PRODUCT GROUPS",
  "DỊCH VỤ TẬN NHÀ": "AT-HOME SERVICE",
  "THÔNG TIN ĐẶT LỊCH": "APPOINTMENT DETAILS",
  "THEO DÕI ĐƠN HÀNG": "ORDER TRACKING",
  "DANH SÁCH VIỆC": "TASK LIST",
  "SẢN PHẨM TRONG ĐƠN": "ORDER ITEMS",
  "ĐƯỢC QUAN TÂM": "POPULAR",
  "GỢI Ý NHỎ": "QUICK TIP",
  "CỬA HÀNG": "STORE",
  "GIỎ HÀNG": "CART",
  "THANH TOÁN": "CHECKOUT",
  "QUẢN TRỊ": "ADMIN",
  "Bán Hàng": "Commerce",

  "Chăm sóc nguồn nước": "Care for your water",
  "từ thiết bị đến lắp đặt": "from equipment to installation",
  "Khám phá sản phẩm": "Explore products",
  "Đặt lịch dịch vụ": "Book a service",
  "Đặt thợ tận nhà": "Book at-home service",
  "Tiếp nhận yêu cầu": "Fast response",
  "Nhóm giải pháp": "Solution groups",
  "Thanh toán tiện lợi": "Convenient payment",
  "Sản phẩm tin cậy": "Trusted products",
  "Thông tin và bảo hành rõ ràng": "Clear information and warranty",
  "Giao hàng toàn quốc": "Nationwide delivery",
  "Đóng gói cẩn thận": "Careful packaging",
  "Lắp đặt tận nơi": "On-site installation",
  "Đặt lịch nhanh qua hệ thống": "Quick online booking",
  "Đặt lịch nhanh qua hotline": "Quick hotline booking",
  "Hỗ trợ tận tâm": "Dedicated support",
  "Tư vấn trước và sau mua": "Support before and after purchase",
  "Kiểm soát chất lượng": "Quality assurance",
  "Thông tin rõ ràng": "Clear information",
  "Thợ đến tận nhà": "At-home technicians",
  "Lắp đặt và bảo trì": "Installation and maintenance",
  "Kiểm tra, sửa chữa và lắp đặt": "Inspection, repair and installation",
  "Đặt thợ kiểm tra, sửa chữa và lắp đặt":
    "Book inspection, repair and installation",
  "Mở trang đặt lịch": "Open booking page",
  "Gọi đặt lịch": "Call to book",
  "Lắp đặt máy lọc": "Purifier installation",
  "Kiểm tra nguồn nước": "Water source inspection",
  "Bảo trì định kỳ": "Scheduled maintenance",
  "Giải pháp cho từng nhu cầu": "Solutions for every need",
  "Sản phẩm nổi bật": "Featured products",
  "Khi nào nên thay lõi lọc?": "When should filters be replaced?",
  "Chọn lõi lọc phù hợp": "Choose the right filter",
  "Xem tất cả": "View all",
  "Xem toàn bộ": "View all",
  "Khám phá": "Explore",
  "Thiết bị chính hãng · Bảo hành minh bạch":
    "Authentic equipment · Transparent warranty",
  "Hỗ trợ mỗi ngày, 8:00 - 21:00": "Daily support, 8:00 AM–9:00 PM",
  "Sản phẩm rõ nguồn gốc": "Products with clear origins",
  "Kỹ thuật tận nhà": "At-home technical service",
  "Nước sạch cho cuộc sống an tâm.":
    "Clean water for a life with peace of mind.",
  "QUY TRÌNH ĐƠN GIẢN": "A SIMPLE PROCESS",
  "Từ nhu cầu đến nguồn nước an tâm": "From your needs to water you can trust",
  "Một quy trình rõ ràng giúp bạn dễ lựa chọn, dễ đặt lịch và luôn biết bước tiếp theo.":
    "A clear process makes choosing, booking and following every next step simple.",
  "Bắt đầu đặt lịch": "Start booking",
  "Chia sẻ nhu cầu": "Share your needs",
  "Cho chúng tôi biết tình trạng nguồn nước, thiết bị hoặc dịch vụ bạn đang cần.":
    "Tell us about your water source, equipment or the service you need.",
  "Nhận tư vấn phù hợp": "Get tailored advice",
  "Minh Phát đề xuất giải pháp rõ ràng theo nhu cầu và ngân sách thực tế.":
    "Minh Phat recommends a clear solution for your real needs and budget.",
  "Chọn lịch thuận tiện": "Choose a convenient time",
  "Đặt thời gian kỹ thuật viên đến kiểm tra, lắp đặt hoặc bảo trì tận nhà.":
    "Schedule an at-home inspection, installation or maintenance visit.",
  "An tâm sử dụng": "Enjoy peace of mind",
  "Theo dõi đơn hàng, lịch sử dịch vụ và nhận hỗ trợ xuyên suốt sau mua.":
    "Track orders and service history with continued after-sales support.",
  "ĐỒNG HÀNH DÀI LÂU": "LONG-TERM CARE",
  "Không chỉ bán thiết bị,": "More than equipment,",
  "chúng tôi chăm sóc cả quá trình sử dụng":
    "we support your entire ownership journey",
  "Từ lúc lựa chọn sản phẩm đến kiểm tra, thay lõi và bảo trì định kỳ, mọi nhu cầu đều được tiếp nhận trên cùng một hệ thống.":
    "From product selection to inspection, filter replacement and scheduled maintenance, every need is handled in one system.",
  "Ngày hỗ trợ mỗi tuần": "Support days every week",
  "Quy trình minh bạch": "Transparent process",
  "Kiểm tra và lắp đặt": "Inspection and installation",
  "Tư vấn minh bạch": "Transparent advice",
  "Đúng nhu cầu · Dễ hiểu": "Relevant · Easy to understand",
  "Giải thích rõ phương án, sản phẩm và các bước thực hiện trước khi khách hàng lựa chọn.":
    "Clear explanations of options, products and next steps before you make a decision.",
  "Chủ động thời gian": "Convenient scheduling",
  "Đặt lịch · Xác nhận": "Book · Confirm",
  "Tiếp nhận lịch trực tuyến và liên hệ xác nhận để bạn dễ sắp xếp thời gian tại nhà.":
    "Book online and receive confirmation so you can easily arrange your time at home.",
  "Hỗ trợ sau mua": "After-sales support",
  "Đồng hành · Tin cậy": "Continued · Reliable",
  "Thông tin đơn hàng và dịch vụ được lưu lại để quá trình hỗ trợ luôn liền mạch.":
    "Order and service details stay available to keep every support interaction seamless.",
  "BẠN CẦN HỖ TRỢ?": "NEED A HAND?",
  "Bắt đầu với một nguồn nước tốt hơn ngay hôm nay":
    "Start enjoying better water today",
  "Khám phá thiết bị phù hợp hoặc đặt lịch để đội ngũ Minh Phát kiểm tra trực tiếp tại nhà.":
    "Find the right equipment or book an at-home assessment with the Minh Phat team.",
  "Xem sản phẩm": "Browse products",
  "Lịch sử đặt lịch": "Service history",
  "DỊCH VỤ CỦA TÔI": "MY SERVICES",
  "Theo dõi tiến độ, cập nhật thông tin và xác nhận chất lượng sau khi kỹ thuật viên hoàn thành.":
    "Track progress, update details and confirm service quality after the technician finishes.",
  "Đặt lịch mới": "Book a new service",
  "Tổng yêu cầu": "Total requests",
  "Đang xử lý": "In progress",
  "Chờ xác nhận": "Awaiting confirmation",
  "Đã khép lại": "Closed",
  "Mới tiếp nhận": "New request",
  "Đã giao kỹ thuật viên": "Technician assigned",
  "Đã giao nhân viên": "Staff assigned",
  "Nhân viên báo xong": "Technician marked complete",
  "Chờ bạn xác nhận": "Awaiting your confirmation",
  "Khách xác nhận": "Customer confirmed",
  "Đang xử lý khiếu nại": "Dispute in progress",
  "Có khiếu nại": "Disputed",
  "Đã hủy": "Cancelled",
  "Đã gửi yêu cầu": "Request submitted",
  "Đã giao việc": "Assigned",
  "Nhân viên báo hoàn thành": "Technician completion",
  "Đang tải lịch sử đặt lịch...": "Loading service history...",
  "Chưa có lịch phù hợp": "No matching appointments",
  "Các yêu cầu dịch vụ của bạn sẽ xuất hiện tại đây.":
    "Your service requests will appear here.",
  "YÊU CẦU": "REQUEST",
  "Kỹ thuật viên": "Technician",
  "Đang chờ phân công": "Awaiting assignment",
  "Cập nhật gần nhất": "Last updated",
  "Ghi chú của bạn": "Your notes",
  "Không có ghi chú": "No notes",
  "Kết quả kỹ thuật viên": "Technician result",
  "Kỹ thuật viên đã báo hoàn thành":
    "The technician has marked this service complete",
  "Vui lòng kiểm tra kết quả trước khi xác nhận.":
    "Please check the result before confirming.",
  "Xác nhận hoàn thành": "Confirm completion",
  "Khiếu nại": "Raise a dispute",
  "Khách hàng yêu cầu xử lý lại": "Customer requested follow-up",
  "Lý do hủy": "Cancellation reason",
  "Đánh giá của bạn": "Your review",
  "Dịch vụ đã hoàn tất": "Service completed",
  "Chia sẻ trải nghiệm để giúp Minh Phát phục vụ tốt hơn.":
    "Share your experience to help Minh Phat improve.",
  "Đánh giá chất lượng phục vụ": "Rate service quality",
  "Gửi nội dung khiếu nại": "Submit a dispute",
  "Mô tả phần việc chưa đạt để quản trị viên có thể liên hệ và xử lý chính xác.":
    "Describe what needs attention so an administrator can contact you and resolve it accurately.",
  "Nội dung cần Minh Phát hỗ trợ thêm...":
    "Tell Minh Phat what still needs attention...",
  "Gửi khiếu nại": "Submit dispute",
  "Đánh giá này sẽ được hiển thị công khai cùng tên của bạn tại trang chủ.":
    "This review will be displayed publicly on the home page with your name.",
  "Mức độ hài lòng": "Satisfaction level",
  "Nội dung đánh giá": "Review content",
  "Chia sẻ cảm nhận về kỹ thuật viên và chất lượng dịch vụ...":
    "Share your experience with the technician and service quality...",
  "Lưu đánh giá": "Save review",
  Đóng: "Close",
  "Bạn có thể cập nhật địa chỉ, thời gian và ghi chú trước khi kỹ thuật viên báo hoàn thành.":
    "You can update the address, time and notes before the technician marks the service complete.",
  "Chỉnh sửa thông tin": "Edit details",
  "Hủy chỉnh sửa": "Cancel editing",
  "Bạn xác nhận kỹ thuật viên đã hoàn thành dịch vụ?":
    "Do you confirm that the technician completed the service?",
  "Đánh giá dịch vụ thực tế": "Verified service reviews",
  "Đánh giá sẽ xuất hiện tại đây sau khi khách hàng xác nhận hoàn thành và chia sẻ trải nghiệm.":
    "Reviews appear here after customers confirm completion and share their experience.",
  "Đặt lịch trải nghiệm dịch vụ": "Book a service",
  "ĐIỀU PHỐI DỊCH VỤ": "SERVICE OPERATIONS",
  "Yêu cầu đặt lịch": "Service requests",
  "Admin tiếp nhận, liên hệ, giao nhân viên hoặc hủy yêu cầu. Phần thực hiện do nhân viên phụ trách.":
    "Administrators receive, contact, assign or cancel requests. Service execution is handled by staff.",
  "Mới tiếp nhận": "New",
  "Đã giao việc": "Assigned",
  "Chờ khách xác nhận": "Awaiting customer",
  "Nhân viên phụ trách": "Assigned staff",
  "Chưa giao việc": "Not assigned",
  "Nhân viên báo xong": "Staff marked complete",
  "Ghi chú khách": "Customer note",
  "Kết quả nhân viên": "Staff result",
  "Ghi chú điều phối": "Operations note",
  "Nội dung liên hệ hoặc lý do hủy (nếu có)...":
    "Contact details or cancellation reason (if any)...",
  "Nhân viên xử lý": "Assigned staff",
  "Chọn nhân viên": "Select staff",
  "việc đang mở": "open tasks",
  "Giao lại việc": "Reassign",
  "Giao việc": "Assign",
  "Liên hệ khách": "Contact customer",
  "Hủy yêu cầu": "Cancel request",
  "Bạn chắc chắn muốn hủy yêu cầu dịch vụ này?":
    "Are you sure you want to cancel this service request?",
  "Vui lòng chọn nhân viên trước khi giao việc.":
    "Select a staff member before assigning the request.",
  "Đang thực hiện": "In progress",
  "Khách đã xác nhận": "Customer confirmed",
  "Cần xử lý lại": "Follow-up required",
  "Chờ khách hàng xác nhận": "Awaiting customer confirmation",
  "Công việc đã khép lại": "Closed tasks",
  "Công việc cần xử lý": "Tasks to handle",
  "Các công việc đã được khách xác nhận hoặc đã hủy.":
    "Tasks confirmed by customers or cancelled.",
  "Nhân viên đã báo xong và đang chờ phản hồi từ khách hàng.":
    "The technician has marked these complete and is awaiting customer feedback.",
  "Việc được giao cũ nhất nằm trên cùng để xử lý theo đúng thứ tự.":
    "The oldest assigned task appears first for timely handling.",
  "Không có việc chờ xác nhận": "No tasks awaiting confirmation",
  "Chưa có việc đã khép lại": "No closed tasks yet",
  "Công việc bạn báo hoàn thành sẽ xuất hiện tại đây.":
    "Tasks you mark complete will appear here.",
  "Lịch sử công việc sẽ xuất hiện tại đây.": "Task history will appear here.",
  "Báo hoàn thành lúc": "Marked complete at",
  "Khách xác nhận lúc": "Customer confirmed at",
  "Báo đã hoàn thành": "Mark service complete",
  "Đánh giá dịch vụ": "Service rating",
  "lượt đánh giá": "reviews",
  "Đánh giá lúc": "Reviewed at",
  "Khách đã xác nhận hoàn thành nhưng chưa gửi đánh giá.":
    "The customer confirmed completion but has not submitted a review yet.",
  "Xem toàn bộ đánh giá dịch vụ": "View all service reviews",
  "TRẢI NGHIỆM ĐÃ XÁC THỰC": "VERIFIED EXPERIENCES",
  "Đánh giá dịch vụ Minh Phát": "Minh Phat service reviews",
  "Mỗi đánh giá đến từ một yêu cầu đã được kỹ thuật viên thực hiện và khách hàng xác nhận hoàn thành.":
    "Every review comes from a completed technician visit confirmed by the customer.",
  "đánh giá đã xác thực": "verified reviews",
  "Đánh giá từ khách hàng thật": "Reviews from real customers",
  "Chỉ khách đã xác nhận dịch vụ hoàn thành mới có thể gửi đánh giá.":
    "Only customers who confirm service completion can submit a review.",
  "Hiển thị": "Showing",
  "Tất cả đánh giá": "All reviews",
  "kết quả": "results",
  "Lọc theo số sao": "Filter by rating",
  "Tất cả số sao": "All ratings",
  "Sắp xếp": "Sort by",
  "Cũ nhất": "Oldest",
  "Số sao: cao đến thấp": "Rating: high to low",
  "Số sao: thấp đến cao": "Rating: low to high",
  "Chưa có đánh giá phù hợp": "No matching reviews",
  "Hãy thử chọn mức sao khác hoặc xem tất cả đánh giá.":
    "Try another rating or view all reviews.",
  "Xem tất cả đánh giá": "View all reviews",
  "Đã xác thực": "Verified",
  "Trang trước": "Previous",
  "Trang sau": "Next",
  "Phân trang đánh giá": "Review pagination",

  "Sản phẩm nước sạch": "Clean-water products",
  "Tất cả sản phẩm": "All products",
  "Bút thử nước": "Water testers",
  "Lõi lọc nước": "Water filters",
  "Máy lọc nước": "Water purifiers",
  "Nước sạch": "Clean water",
  "Đang tải sản phẩm...": "Loading products...",
  "Không tìm thấy sản phẩm": "No products found",
  "Mới nhất": "Newest",
  "Giá tăng dần": "Price: low to high",
  "Giá giảm dần": "Price: high to low",
  "Tên A-Z": "Name A–Z",
  "Hết hàng": "Out of stock",
  "Tạm hết hàng": "Temporarily out of stock",
  "Thêm vào giỏ hàng": "Add to cart",
  "Thêm vào giỏ": "Add to cart",
  "Đã thêm vào giỏ hàng": "Added to cart",
  "Miễn phí giao hàng": "Free shipping",
  "Đơn từ 500.000đ": "Orders from 500,000₫",
  "Đảm bảo thông tin": "Accurate information",
  "Mô tả sản phẩm": "Product description",
  "Đánh giá khách hàng": "Customer reviews",
  "Viết đánh giá": "Write a review",
  "Số sao": "Rating",
  "Tiêu đề": "Title",
  "Ấn tượng của bạn": "Your overall impression",
  "Nội dung": "Review",
  "Gửi đánh giá": "Submit review",
  "Chưa có đánh giá nào.": "No reviews yet.",
  "đánh giá": "reviews",
  Còn: "In stock:",
  "sản phẩm": "products",
  cho: "for",

  "Đăng nhập để xem giỏ hàng": "Sign in to view your cart",
  "Đăng nhập ngay": "Sign in now",
  "Giỏ hàng đang trống": "Your cart is empty",
  "Tiếp tục mua sắm": "Continue shopping",
  "Sản phẩm đã chọn": "Selected products",
  "Tóm tắt đơn hàng": "Order summary",
  "Tạm tính": "Subtotal",
  "Phí giao hàng dự kiến": "Estimated shipping",
  "Phí giao hàng": "Shipping",
  "Miễn phí": "Free",
  "Tổng dự kiến": "Estimated total",
  "Tiến hành thanh toán": "Proceed to checkout",
  "Hoàn tất đơn hàng": "Complete your order",
  "Thông tin nhận hàng": "Delivery information",
  "Họ tên người nhận": "Recipient name",
  "Số điện thoại": "Phone number",
  "Địa chỉ cụ thể": "Street address",
  "Số nhà, tên đường...": "House number and street...",
  "Phường/Xã": "Ward",
  "Quận/Huyện": "District",
  "Tỉnh/Thành phố": "Province/City",
  "Lưu địa chỉ cho lần mua sau": "Save this address for future orders",
  "Phương thức thanh toán": "Payment method",
  "Ghi chú": "Notes",
  "Đơn hàng của bạn": "Your order",
  "Mã giảm giá": "Coupon code",
  "Áp dụng": "Apply",
  "Tổng thanh toán": "Total payment",
  "Đặt hàng COD": "Place COD order",
  "Đang tạo đơn...": "Creating order...",
  "Đặt hàng thành công": "Order placed successfully",
  "Không tìm thấy trang": "Page not found",
  "Đường dẫn bạn truy cập không tồn tại hoặc đã thay đổi.":
    "The page you requested does not exist or has moved.",
  "Về trang chủ": "Back to home",

  "Nguồn nước tốt,": "Better water,",
  "khởi đầu sống khỏe.": "a healthier start.",
  "Tạo tài khoản": "Create your account",
  "trong vài phút.": "in just a few minutes.",
  "Tao tai khoan": "Create your account",
  "trong vai phut.": "in just a few minutes.",
  "Theo doi don hang va luu thong tin nhan hang tien loi hon.":
    "Track orders and save delivery details for a faster checkout.",
  "Đăng ký tài khoản": "Create an account",
  "Dang ky tai khoan": "Create an account",
  "Chưa có tài khoản?": "New here?",
  "Đăng ký miễn phí": "Create a free account",
  "Đã có tài khoản?": "Already have an account?",
  "Da co tai khoan?": "Already have an account?",
  "Họ và tên": "Full name",
  "Ho va ten": "Full name",
  "Mật khẩu": "Password",
  "Mat khau": "Password",
  "Xác nhận mật khẩu": "Confirm password",
  "Xac nhan mat khau": "Confirm password",
  "Gửi mã xác thực": "Send verification code",
  "Gui ma xac thuc": "Send verification code",
  "Đang gửi mã...": "Sending code...",
  "Dang gui ma...": "Sending code...",
  "Mã xác thực": "Verification code",
  "Ma xac thuc": "Verification code",
  "Đang xác thực...": "Verifying...",
  "Dang xac thuc...": "Verifying...",
  "Xác thực và tạo tài khoản": "Verify and create account",
  "Xac thuc va tao tai khoan": "Verify and create account",
  "Đổi thông tin đăng ký": "Change registration details",
  "Doi thong tin dang ky": "Change registration details",
  "Mật khẩu xác nhận không khớp": "Passwords do not match",
  "Mat khau xac nhan khong khop": "Passwords do not match",
  "Mã xác thực đã được gửi đến email của bạn":
    "A verification code has been sent to your email",
  "Ma xac thuc da duoc gui den email cua ban":
    "A verification code has been sent to your email",
  "Mật khẩu tối thiểu 6 ký tự. Không sử dụng mật khẩu quan trọng của bạn.":
    "Use at least 6 characters and do not reuse an important password.",
  "Mat khau toi thieu 6 ky tu. Khong su dung mat khau quan trong cua ban.":
    "Use at least 6 characters and do not reuse an important password.",
  "Đang đăng nhập...": "Signing in...",
  "Đăng nhập bằng gương mặt": "Sign in with face recognition",
  "Tiếp tục sử dụng dịch vụ bằng Google": "Continue with Google",
  "Google chưa được cấu hình": "Google sign-in is not configured",
  "Tài khoản admin mẫu": "Demo admin account",
  hoặc: "or",
  "Ẩn mật khẩu": "Hide password",
  "Hiện mật khẩu": "Show password",

  "Đặt lịch kỹ thuật viên": "Book a technician",
  "Lắp đặt và sửa chữa": "Installation and repair",
  "Tư vấn nguồn nước": "Water consultation",
  "Theo dõi tiến độ": "Track progress",
  "Kiểm tra lại thông tin trước khi gửi":
    "Review your details before submitting",
  "Đăng nhập để đặt lịch": "Sign in to book a service",
  "Dịch vụ cần hỗ trợ": "Service required",
  "Thời gian mong muốn": "Preferred time",
  "Ví dụ: Sáng thứ 7": "Example: Saturday morning",
  "Gửi yêu cầu đặt lịch": "Send booking request",
  "Đang gửi...": "Sending...",
  "Gọi hotline": "Call hotline",
  "Thay lõi lọc": "Filter replacement",
  "Sửa chữa máy lọc": "Purifier repair",

  "TÀI KHOẢN CỦA TÔI": "MY ACCOUNT",
  "Đơn hàng của tôi": "My orders",
  "Lịch sử đơn hàng": "Order history",
  "Sổ địa chỉ": "Address book",
  "Cài đặt": "Settings",
  "Bạn chưa có đơn hàng nào.": "You have no orders yet.",
  "Bạn chưa có đơn hàng nào": "You have no orders yet",
  "Xem trạng thái xử lý, thông tin giao hàng và chi tiết sản phẩm trong từng đơn.":
    "View processing status, delivery information and item details for every order.",
  "Những đơn hàng đã đặt sẽ xuất hiện tại đây để bạn theo dõi tiến trình giao hàng.":
    "Placed orders will appear here so you can follow their delivery progress.",
  "Mua sắm ngay": "Shop now",
  "Hủy đơn": "Cancel order",
  "Giao tới": "Deliver to",
  "Lưu thay đổi": "Save changes",
  "Đã cập nhật thông tin": "Information updated",
  "Ngôn ngữ": "Language",
  "Tiếng Việt": "Vietnamese",
  "Giao diện tối": "Dark mode",
  "Đang dùng giao diện tối.": "Dark mode is on.",
  "Đang dùng giao diện sáng.": "Light mode is on.",
  "Chuyển giao diện sáng hoặc tối": "Switch between light and dark mode",
  "Chuyển sang giao diện sáng": "Switch to light mode",
  "Chuyển sang giao diện tối": "Switch to dark mode",
  "Chuyển sang tiếng Việt": "Switch to Vietnamese",
  "Chuyển sang tiếng Anh": "Switch to English",
  "Đã bật": "Enabled",
  "Đăng ký lại": "Enroll again",
  "Đăng ký gương mặt": "Enroll face",
  "Đăng ký": "Enroll",
  "Xóa gương mặt": "Delete face",
  "Xóa dữ liệu gương mặt": "Delete face data",
  "Thêm địa chỉ": "Add address",
  "Người nhận": "Recipient",
  "Điện thoại": "Phone",
  "Địa chỉ": "Address",
  "Đặt làm địa chỉ mặc định": "Set as default address",
  "Mặc định": "Default",
  "Xóa địa chỉ này?": "Delete this address?",
  "Đăng xuất": "Sign out",

  "MÃ ĐƠN": "ORDER CODE",
  "Chờ xác nhận": "Pending",
  "Đã xác nhận": "Confirmed",
  "Đang đóng gói": "Packing",
  "Đang giao": "Shipping",
  "Đã giao": "Delivered",
  "Đã hủy": "Cancelled",
  "Không có đơn hàng ở trạng thái này.": "No orders with this status.",
  "Tiếp tục mua hàng": "Continue shopping",

  "Tổng quan": "Overview",
  "TRUNG TÂM QUẢN TRỊ": "ADMIN CONTROL CENTER",
  "Tổng quan cửa hàng": "Store overview",
  "Dữ liệu hiện tại": "Live data",
  "Sản phẩm đang bán": "Active products",
  "Đơn chờ xác nhận": "Orders awaiting confirmation",
  "Yêu cầu tư vấn mới": "New service requests",
  "DOANH THU ĐÃ GIAO": "DELIVERED REVENUE",
  "Tổng giá trị các đơn hàng đã hoàn tất.": "Total value of completed orders.",
  "Tình trạng vận hành": "Operational health",
  "Người dùng hoạt động": "Active users",
  "Đơn đã giao": "Delivered orders",
  "Sản phẩm sắp hết hàng": "Low-stock products",
  "QUẢN LÝ DANH MỤC HÀNG": "PRODUCT MANAGEMENT",
  "Chỉnh sửa sản phẩm": "Edit product",
  "Thêm sản phẩm mới": "Add a new product",
  "Chọn danh mục": "Select a category",
  "Tên sản phẩm": "Product name",
  "Slug (có thể để trống)": "Slug (optional)",
  "Đơn vị": "Unit",
  "Mô tả ngắn": "Short description",
  "Mô tả chi tiết": "Detailed description",
  "Giá bán": "Sale price",
  "Giá gạch": "Compare-at price",
  "Ngưỡng cảnh báo": "Low-stock threshold",
  "Hình ảnh sản phẩm": "Product image",
  "Hoặc nhập URL hình ảnh": "Or enter an image URL",
  "Nổi bật": "Featured",
  "XỬ LÝ BÁN HÀNG": "ORDER OPERATIONS",
  "Quản lý đơn hàng": "Order management",
  "Tổng đơn": "Total orders",
  "Đang xử lý": "In progress",
  "Giá trị đơn hiển thị": "Displayed order value",
  "Tự cập nhật mỗi 10 giây. Lần tải gần nhất":
    "Refreshes every 10 seconds. Last updated",
  "Chưa có đơn hàng phù hợp với bộ lọc hiện tại.":
    "No orders match the current filters.",
  "CHƯƠNG TRÌNH ƯU ĐÃI": "PROMOTIONS",
  "Tạo mã mới": "Create a coupon",
  "Tên chương trình": "Campaign name",
  Loại: "Type",
  "Phần trăm": "Percentage",
  "Số tiền cố định": "Fixed amount",
  "Giá trị": "Value",
  "Đơn tối thiểu": "Minimum order",
  "Giảm tối đa": "Maximum discount",
  "Giới hạn lượt": "Usage limit",
  "Bắt đầu": "Starts",
  "Kết thúc": "Ends",
  "Tạo mã": "Create coupon",
  "Danh sách mã": "Coupon list",
  Mã: "Code",
  "Yêu cầu tư vấn": "Service requests",
  "Mã giảm giá": "Coupons",
  "Người dùng": "Users",
  "Về cửa hàng": "Back to store",
  "Doanh thu": "Revenue",
  "Khách hàng": "Customers",
  "Nhân viên": "Staff",
  "Quản trị": "Admin",
  "Vai trò": "Role",
  "Ngày tạo": "Created",
  "Trạng thái": "Status",
  "Hoạt động": "Active",
  "Đã khóa": "Locked",
  Khóa: "Lock",
  "Mở khóa": "Unlock",
  "Tài khoản hiện tại": "Current account",
  "Đổi vai trò người dùng": "Change user role",
  "Không thể đổi vai trò của chính mình": "You cannot change your own role",
  "Tên danh mục": "Category name",
  "Mô tả": "Description",
  "Thứ tự hiển thị": "Display order",
  "Đang hoạt động": "Active",
  "Thêm danh mục": "Add category",
  "Sửa danh mục": "Edit category",
  "Danh sách danh mục": "Category list",
  Hiện: "Visible",
  Ẩn: "Hide",
  Sửa: "Edit",
  Xóa: "Delete",
  Lưu: "Save",
  Hủy: "Cancel",
  "Xóa hoặc ẩn danh mục này?": "Delete or hide this category?",
  "Danh sách sản phẩm": "Product list",
  "Tìm tên hoặc SKU": "Search by name or SKU",
  Tìm: "Search",
  Giá: "Price",
  "Tồn kho": "Stock",
  "Đang bán": "On sale",
  "Đã ẩn": "Hidden",
  "Thêm sản phẩm": "Add product",
  "Hủy sửa": "Cancel editing",
  "Lưu thay đổi": "Save changes",
  "Tổng yêu cầu": "Total requests",
  "Mới gửi": "New",
  "Đã liên hệ": "Contacted",
  "Đã hẹn lịch": "Scheduled",
  "Hoàn tất": "Completed",
  "Tất cả": "All",
  "Làm mới": "Refresh",
  "Đang tải...": "Loading...",
  "Đang tải yêu cầu tư vấn...": "Loading service requests...",
  "Tên, SĐT, địa chỉ, dịch vụ...": "Name, phone, address or service...",
  "Nhân viên xử lý": "Assigned staff",
  "Chưa giao nhân viên": "Not assigned",
  "việc đang mở": "open tasks",
  "Chưa có người phụ trách": "No one assigned",
  "Đã giao lúc": "Assigned at",
  "Đã liên hệ lúc": "Contacted at",
  "Hoàn tất lúc": "Completed at",
  "Ghi chú khách": "Customer note",
  "Ghi chú xử lý": "Processing note",

  "Công việc nhân viên": "Staff workspace",
  "Công việc của tôi": "My tasks",
  "Chưa hoàn thành": "Open tasks",
  "Đã hoàn thành": "Completed",
  "Tổng việc được giao": "Total assigned",
  "Việc đã hoàn thành": "Completed tasks",
  "Việc chưa hoàn thành": "Open tasks",
  "Đang tải danh sách công việc...": "Loading tasks...",
  "Chưa có việc hoàn thành": "No completed tasks",
  "Không có việc đang mở": "No open tasks",
  "giao lúc": "assigned at",
  "Email khách": "Customer email",
  "Ghi chú kết quả": "Completion note",
  "Gọi khách": "Call customer",
  "Đang lưu...": "Saving...",
  "Đánh dấu hoàn thành": "Mark as completed",
  "Chưa chọn": "Not selected",

  "Trợ lý tư vấn sản phẩm": "Product advisor",
  "Tư vấn sản phẩm": "Product advice",
  "Trợ lý AI của Minh Phát": "Minh Phat AI assistant",
  "Cuộc trò chuyện mới": "New conversation",
  "Đóng trợ lý": "Close assistant",
  "Đang trả lời": "Responding",
  "Nhập nhu cầu của bạn...": "Tell us what you need...",
  "Nội dung cần tư vấn": "Your question",
  "Gửi câu hỏi": "Send question",
  "Mở trợ lý tư vấn": "Open product advisor",
  "Đóng trợ lý tư vấn": "Close product advisor",
  "Nhà 4 người nên chọn máy nào?":
    "Which purifier is right for a family of four?",
  "Tư vấn lõi lọc cần thay": "Which filters should I replace?",
  "Ngân sách dưới 6 triệu": "Budget under 6 million VND",
  "Xin chào, mình là trợ lý tư vấn của Minh Phát. Bạn đang cần chọn máy lọc, lõi thay thế hay thiết bị kiểm tra nước?":
    "Hi, I'm Minh Phat's product advisor. Are you looking for a purifier, replacement filter or water tester?",

  "Nhìn thẳng vào camera": "Look straight at the camera",
  "Nghiêng nhẹ đầu sang trái": "Turn your head slightly left",
  "Nghiêng nhẹ đầu sang phải": "Turn your head slightly right",
  "Đang mở camera...": "Opening camera...",
  "Camera chưa sẵn sàng": "Camera is not ready",
  "Không thể chụp ảnh": "Could not capture the photo",
  "Đang tạo dữ liệu gương mặt...": "Creating face data...",
  "Đang xác minh gương mặt...": "Verifying your face...",
  "Đang tạo thử thách mới...": "Preparing a new challenge...",
  "Thực hiện thử thách": "Complete the challenge",
  Ảnh: "Photo",
  Bước: "Step",
  "Xác thực gương mặt": "Face verification",
  "Đóng camera": "Close camera",
  "Thử lại": "Try again",
  "Đang xử lý...": "Processing...",
  "Chụp ảnh": "Capture photo",

  "Trang chủ": "Home",
  "Sản phẩm": "Products",
  "Danh mục": "Categories",
  "Đơn hàng": "Orders",
  "Tài khoản": "Account",
  "Thông tin tài khoản": "Account information",
  "Thông tin cá nhân": "Personal information",
  "Công việc": "Tasks",
  "Đặt lịch": "Book service",
  "Đăng nhập": "Sign in",
  "Giỏ hàng": "Cart",
  "Tìm sản phẩm...": "Search products...",
  "Tìm kiếm sản phẩm": "Search products",
  "Hỗ trợ": "Support",
  "Cam kết": "Our promise",
  "Hàng chính hãng": "Genuine products",
  "Đổi trả minh bạch": "Transparent returns",
  "Bảo hành tận nơi": "On-site warranty",
  "Thứ 2 - Chủ nhật: 8:00 - 21:00": "Monday – Sunday: 8:00 – 21:00",
  "Mở menu": "Open menu",
  "Đóng menu": "Close menu",
  Sáng: "Light",
  Tối: "Dark",
  Đóng: "Close",
  Gửi: "Send",
};

const sortedTranslations = Object.entries(translations).sort(
  ([left], [right]) => right.length - left.length,
);

const translationPattern = new RegExp(
  sortedTranslations
    .map(([source]) => source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

const translateText = (value) => {
  if (!value) return value;
  return value.replace(
    translationPattern,
    (source) => translations[source] ?? source,
  );
};

const textState = new WeakMap();
const attributeState = new WeakMap();
const translatedAttributes = ["placeholder", "title", "aria-label"];
const ignoredTags = new Set(["SCRIPT", "STYLE", "TEXTAREA"]);

const renderTextNode = (node, language) => {
  const parent = node.parentElement;
  if (!parent || ignoredTags.has(parent.tagName)) return;

  const currentValue = node.nodeValue;
  let state = textState.get(node);

  if (!state) {
    state = { source: currentValue, rendered: currentValue };
  } else if (currentValue !== state.rendered) {
    // React or an API response updated this existing node.
    state.source = currentValue;
  }

  const rendered =
    language === "en" ? translateText(state.source) : state.source;
  state.rendered = rendered;
  textState.set(node, state);

  if (currentValue !== rendered) node.nodeValue = rendered;
};

const renderAttributes = (element, language) => {
  let states = attributeState.get(element);
  if (!states) states = new Map();

  translatedAttributes.forEach((attribute) => {
    const currentValue = element.getAttribute(attribute);
    if (!currentValue) return;

    let state = states.get(attribute);
    if (!state) {
      state = { source: currentValue, rendered: currentValue };
    } else if (currentValue !== state.rendered) {
      state.source = currentValue;
    }

    const rendered =
      language === "en" ? translateText(state.source) : state.source;
    state.rendered = rendered;
    states.set(attribute, state);

    if (currentValue !== rendered) element.setAttribute(attribute, rendered);
  });

  attributeState.set(element, states);
};

const translateDom = (language) => {
  if (!document.body) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) renderTextNode(walker.currentNode, language);

  document
    .querySelectorAll("[placeholder], [title], [aria-label]")
    .forEach((element) => renderAttributes(element, language));
};

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem(STORAGE_KEY);
  return savedLanguage === "en" ? "en" : "vi";
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEY, language);

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => translateDom(language));
    };

    translateDom(language);
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes,
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isEnglish: language === "en",
      t: (text) => (language === "en" ? translateText(text) : text),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
