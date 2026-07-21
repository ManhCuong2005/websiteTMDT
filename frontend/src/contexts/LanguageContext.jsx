import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);
const STORAGE_KEY = "banhang_language";

const translations = {
  "Trang chủ": "Home",
  "Sản phẩm": "Products",
  "Bút thử nước": "Water testers",
  "Lõi lọc": "Filter cartridges",
  "Máy lọc": "Water purifiers",
  "Đơn hàng": "Orders",
  "Tài khoản": "Account",
  "Thông tin cá nhân": "Personal information",
  "Đăng xuất": "Sign out",
  "Đăng nhập": "Sign in",
  "Giỏ hàng": "Cart",
  "Tìm sản phẩm...": "Search products...",
  "Tìm kiếm sản phẩm": "Search products",
  "Danh mục": "Categories",
  "Hỗ trợ": "Support",
  "Cam kết": "Commitment",
  "Hàng chính hãng": "Genuine products",
  "Đổi trả minh bạch": "Transparent returns",
  "Bảo hành tận nơi": "On-site warranty",
  "Thứ 2 - Chủ nhật: 8:00 - 21:00": "Monday - Sunday: 8:00 - 21:00",
  "CỬA HÀNG": "STORE",
  "Sản phẩm nước sạch": "Clean water products",
  "Chọn đúng thiết bị kiểm tra, lõi thay thế và máy lọc cho nhu cầu của bạn.": "Choose the right tester, replacement cartridge, and purifier for your needs.",
  "Tất cả sản phẩm": "All products",
  "Mới nhất": "Newest",
  "Giá tăng dần": "Price: low to high",
  "Giá giảm dần": "Price: high to low",
  "Tên A-Z": "Name A-Z",
  "Đang tải sản phẩm...": "Loading products...",
  "Không tìm thấy sản phẩm": "No products found",
  "Thử đổi từ khóa hoặc danh mục khác.": "Try another keyword or category.",
  "Hết hàng": "Out of stock",
  "Thêm vào giỏ": "Add to cart",
  "NGUỒN NƯỚC AN TÂM · DỊCH VỤ TẬN NHÀ": "SAFE WATER · AT-HOME SERVICE",
  "Chăm sóc nguồn nước": "Care for your water",
  "từ thiết bị đến lắp đặt": "from devices to installation",
  "Minh Phát giúp bạn chọn đúng bút thử nước, lõi lọc, máy lọc và đặt thợ kiểm tra, lắp đặt, bảo trì ngay tại nhà.": "Minh Phat helps you choose testers, filters, purifiers, and book at-home inspection, installation, and maintenance.",
  "Khám phá sản phẩm": "Explore products",
  "Đặt thợ tận nhà": "Book at-home service",
  "Tiếp nhận yêu cầu": "Request handling",
  "Nhóm giải pháp": "Solution groups",
  "Thanh toán tiện lợi": "Convenient payment",
  "Sản phẩm tin cậy": "Trusted products",
  "Thông tin và bảo hành rõ ràng": "Clear information and warranty",
  "Giao hàng toàn quốc": "Nationwide delivery",
  "Đóng gói cẩn thận": "Careful packaging",
  "Lắp đặt tận nơi": "On-site installation",
  "Đặt lịch nhanh qua hotline": "Quick booking by hotline",
  "Hỗ trợ tận tâm": "Dedicated support",
  "Tư vấn trước và sau mua": "Advice before and after purchase",
  "DỊCH VỤ TẬN NHÀ": "AT-HOME SERVICE",
  "Đặt thợ kiểm tra, sửa chữa và lắp đặt": "Book inspection, repair, and installation",
  "Phù hợp khi bạn cần lắp máy mới, thay lõi lọc, kiểm tra chất lượng nước hoặc xử lý máy chảy yếu, rò rỉ.": "Ideal for new installation, filter replacement, water testing, weak flow, or leaks.",
  "Gọi đặt lịch": "Call to book",
  "Lắp đặt máy lọc": "Purifier installation",
  "Kỹ thuật viên đến tận nhà, kiểm tra vị trí và lắp đặt gọn gàng.": "Technicians visit, inspect the setup, and install neatly.",
  "Kiểm tra nguồn nước": "Water source inspection",
  "Đo nhanh TDS, tư vấn lõi lọc phù hợp với tình trạng nước thực tế.": "Quick TDS testing and filter advice for your actual water condition.",
  "Bảo trì định kỳ": "Scheduled maintenance",
  "Nhắc lịch thay lõi, vệ sinh máy và kiểm tra rò rỉ để dùng bền hơn.": "Filter reminders, cleaning, and leak checks for longer product life.",
  "DANH MỤC NỔI BẬT": "FEATURED CATEGORIES",
  "Giải pháp cho từng nhu cầu": "Solutions for every need",
  "Xem tất cả": "View all",
  "Khám phá": "Explore",
  "ĐƯỢC QUAN TÂM": "POPULAR",
  "Sản phẩm nổi bật": "Featured products",
  "Xem toàn bộ": "View all",
  "GỢI Ý NHỎ": "QUICK TIP",
  "Khi nào nên thay lõi lọc?": "When should you replace filters?",
  "Kiểm tra định kỳ giúp máy hoạt động ổn định và đảm bảo chất lượng nước đầu ra. Lõi thô thường cần thay sau 3-9 tháng tùy nguồn nước và tần suất sử dụng.": "Regular checks keep the purifier stable and water quality consistent. Pre-filters usually need replacement after 3-9 months depending on water source and usage.",
  "Chọn lõi lọc phù hợp": "Choose the right filter",
  "Chờ xác nhận": "Pending",
  "Đã xác nhận": "Confirmed",
  "Đang đóng gói": "Packing",
  "Đang giao": "Shipping",
  "Đã giao": "Delivered",
  "Đã hủy": "Cancelled",
  "Thanh toán": "Checkout",
  "Đặt hàng": "Place order",
  "Địa chỉ giao hàng": "Shipping address",
  "Thông tin nhận hàng": "Delivery information",
  "Áp dụng": "Apply",
  "Mã giảm giá": "Coupon code",
};

const reverseTranslations = Object.fromEntries(
  Object.entries(translations).map(([vi, en]) => [en, vi]),
);

const replaceText = (value, dictionary) => {
  let nextValue = value;

  Object.entries(dictionary)
    .sort(([a], [b]) => b.length - a.length)
    .forEach(([from, to]) => {
      nextValue = nextValue.replaceAll(from, to);
    });

  return nextValue;
};

const translateDom = (language) => {
  const dictionary = language === "en" ? translations : reverseTranslations;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const ignoredTags = new Set(["SCRIPT", "STYLE", "TEXTAREA"]);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;

    if (!parent || ignoredTags.has(parent.tagName)) continue;

    const nextValue = replaceText(node.nodeValue, dictionary);
    if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
  }

  document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;

      const nextValue = replaceText(value, dictionary);
      if (nextValue !== value) element.setAttribute(attribute, nextValue);
    });
  });
};

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem(STORAGE_KEY);
  return savedLanguage === "en" ? "en" : "vi";
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "vi";
    localStorage.setItem(STORAGE_KEY, language);

    const apply = () => translateDom(language);
    apply();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(apply);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isEnglish: language === "en",
      t: (text) =>
        language === "en" ? replaceText(text, translations) : replaceText(text, reverseTranslations),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
