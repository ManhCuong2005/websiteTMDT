import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Icon } from "./Icons";
import AdvisorWidget from "./AdvisorWidget";
import UserAvatar from "./UserAvatar";

export default function Layout() {
  const { user } = useAuth();
  const { cart } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, isEnglish } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const closeMenu = () => setOpen(false);
  const isProductsActive = location.pathname === "/san-pham";
  const accountPath =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "STAFF"
        ? "/staff"
        : "/tai-khoan";

  const submitSearch = (event) => {
    event.preventDefault();
    const keyword = search.trim();
    navigate(
      keyword ? `/san-pham?search=${encodeURIComponent(keyword)}` : "/san-pham",
    );
    setOpen(false);
  };

  return (
    <div className="site-shell">
      <div className="utility-bar">
        <div className="utility-inner">
          <span><Icon name="shield" size={14} /> Thiết bị chính hãng · Bảo hành minh bạch</span>
          <div>
            <a href="tel:0977148627">Hotline: <b>0977 148 627</b></a>
            <span>Hỗ trợ mỗi ngày, 8:00 - 21:00</span>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="header-inner header-container">
          <Link className="brand" to="/" onClick={closeMenu}>
            <span className="brand-drop">MP</span>
            <span className="brand-text">
              <b>CTCP Xử Lý Nước</b>
              <small>MINH PHÁT</small>
            </span>
          </Link>

          <button
            type="button"
            className="mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>

          <nav className={open ? "main-nav open" : "main-nav"}>
            <NavLink to="/" end onClick={closeMenu}>
              Trang chủ
            </NavLink>
            <Link
              className={isProductsActive ? "active" : ""}
              to="/san-pham"
              onClick={closeMenu}
            >
              Sản phẩm
            </Link>
            <NavLink to="/dat-lich" onClick={closeMenu}>
              Đặt lịch
            </NavLink>
            {user?.role === "STAFF" && (
              <NavLink to="/staff" onClick={closeMenu}>
                Công việc
              </NavLink>
            )}
            {user && user.role !== "STAFF" && (
              <NavLink to="/don-hang" onClick={closeMenu}>
                Đơn hàng
              </NavLink>
            )}
            {user?.role === "CUSTOMER" && (
              <NavLink to="/lich-su-dat-lich" onClick={closeMenu}>
                Lịch sử đặt lịch
              </NavLink>
            )}

            <div className="mobile-nav-account">
              {user ? (
                <>
                  <NavLink to={accountPath} onClick={closeMenu}>
                    <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} size={27} />
                    <span>
                      {user.role === "STAFF"
                        ? "Công việc của tôi"
                        : "Thông tin cá nhân"}
                    </span>
                  </NavLink>
                </>
              ) : (
                <NavLink to="/dang-nhap" onClick={closeMenu}>
                  <Icon name="user" size={18} />
                  <span>Đăng nhập</span>
                </NavLink>
              )}
            </div>
          </nav>

          <div className="header-actions">
            <form className="header-search" onSubmit={submitSearch}>
              <Icon name="search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm"
              />
            </form>

            <div className="header-user-actions">
              {user ? (
                <div className="account-menu">
                  <Link
                    className="account-link"
                    to={accountPath}
                    title="Thông tin tài khoản"
                  >
                    <UserAvatar
                      avatarUrl={user.avatarUrl}
                      name={user.fullName}
                      size={32}
                      className="header-user-avatar"
                    />
                    <span className="account-text">
                      <small>
                        {user.role === "STAFF" ? "Nhân viên" : "Tài khoản"}
                      </small>
                      <strong>
                        {user.fullName?.split(" ").at(-1) || "Người dùng"}
                      </strong>
                    </span>
                  </Link>
                </div>
              ) : (
                <Link className="login-link" to="/dang-nhap">
                  <span className="header-action-icon">
                    <Icon name="user" />
                  </span>
                  <span>Đăng nhập</span>
                </Link>
              )}

              <button
                type="button"
                className="language-toggle"
                onClick={() => setLanguage(isEnglish ? "vi" : "en")}
                title={
                  isEnglish
                    ? "Chuyển sang tiếng Việt"
                    : "Chuyển sang tiếng Anh"
                }
                aria-label={
                  isEnglish
                    ? "Chuyển sang tiếng Việt"
                    : "Chuyển sang tiếng Anh"
                }
              >
                <span>{language.toUpperCase()}</span>
              </button>

              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                title={
                  isDark
                    ? "Chuyển sang giao diện sáng"
                    : "Chuyển sang giao diện tối"
                }
                aria-label={
                  isDark
                    ? "Chuyển sang giao diện sáng"
                    : "Chuyển sang giao diện tối"
                }
              >
                <Icon name={isDark ? "sun" : "moon"} size={18} />
              </button>

              {user?.role !== "STAFF" && (
                <Link className="cart-link" to="/gio-hang" title="Giỏ hàng">
                  <span className="cart-icon-wrapper">
                    <Icon name="cart" />
                    <span className="cart-count">{cart.totalItems || 0}</span>
                  </span>
                  <span className="cart-text">Giỏ hàng</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-intro">
            <Link className="brand footer-brand" to="/">
              <span className="brand-drop">MP</span>
              <span className="brand-text">
                <b style={{ color: "white" }}>CTCP Xử Lý Nước</b>
                <small>MINH PHÁT</small>
              </span>
            </Link>
            <p>
              Giải pháp kiểm tra, lắp đặt và bảo trì máy lọc nước đáng tin cậy
              cho mọi gia đình Việt.
            </p>
            <div className="footer-trust">
              <span><Icon name="shield" size={15} /> Sản phẩm rõ nguồn gốc</span>
              <span><Icon name="tool" size={15} /> Kỹ thuật tận nhà</span>
            </div>
          </div>
          <div>
            <h4>Danh mục</h4>
            <Link to="/san-pham?category=but-thu-nuoc">Bút thử nước</Link>
            <Link to="/san-pham?category=loi-loc-nuoc">Lõi lọc nước</Link>
            <Link to="/san-pham?category=may-loc-nuoc">Máy lọc nước</Link>
            <Link to="/dat-lich">Đặt lịch dịch vụ</Link>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <span>Hotline: 0977148627</span>
            <span>Email: manhcuongnguyen2205@gmail.com</span>
            <span>Thứ 2 - Chủ nhật: 8:00 - 21:00</span>
            <Link to="/danh-gia-dich-vu">Đánh giá dịch vụ</Link>
          </div>
          <div>
            <h4>Cam kết</h4>
            <span>Hàng chính hãng</span>
            <span>Đổi trả minh bạch</span>
            <span>Bảo hành tận nơi</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 CTCP Xử Lý Nước Minh Phát.</span>
          <span>Nước sạch cho cuộc sống an tâm.</span>
        </div>
      </footer>

      <AdvisorWidget />

      <a
        className="floating-zalo"
        href="https://zalo.me/0977148627"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat Zalo với Minh Phát"
        title="Chat Zalo"
      >
        <span>Zalo</span>
      </a>
    </div>
  );
}
