import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { Icon } from "./Icons";

export default function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (!confirmed) return;

    logout();
    setOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const keyword = search.trim();
    navigate(keyword ? `/san-pham?search=${encodeURIComponent(keyword)}` : "/san-pham");
    setOpen(false);
  };
  return (
    <div className="site-shell">
      {/* <div className="announcement">Miễn phí giao hàng cho đơn từ 500.000đ · Tư vấn nguồn nước tận tâm</div> */}
      <header className="site-header">
        <div className="header-inner header-container">
          <Link className="brand" to="/">
            <span className="brand-drop">◆</span>

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
            <NavLink to="/" onClick={() => setOpen(false)}>
              Trang chủ
            </NavLink>

            <NavLink to="/san-pham" onClick={() => setOpen(false)}>
              Sản phẩm
            </NavLink>

            <NavLink
              to="/san-pham?category=but-thu-nuoc"
              onClick={() => setOpen(false)}
            >
              Bút thử nước
            </NavLink>

            <NavLink
              to="/san-pham?category=loi-loc-nuoc"
              onClick={() => setOpen(false)}
            >
              Lõi lọc
            </NavLink>

            <NavLink
              to="/san-pham?category=may-loc-nuoc"
              onClick={() => setOpen(false)}
            >
              Máy lọc
            </NavLink>

            {user && (
              <NavLink to="/don-hang" onClick={() => setOpen(false)}>
                Đơn hàng
              </NavLink>
            )}
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
                    to={user.role === "ADMIN" ? "/admin" : "/tai-khoan"}
                    title="Thông tin tài khoản"
                  >
                    <span className="header-action-icon">
                      <Icon name="user" />
                    </span>

                    <span className="account-text">
                      <small>Tài khoản</small>
                      <strong>
                        {user.fullName?.split(" ").at(-1) || "Người dùng"}
                      </strong>
                    </span>
                  </Link>

                  <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                    title="Đăng xuất"
                    aria-label="Đăng xuất"
                  >
                    <Icon name="logout" size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <Link className="login-link" to="/dang-nhap">
                  <span className="header-action-icon">
                    <Icon name="user" />
                  </span>

                  <span>Đăng nhập</span>
                </Link>
              )}

              <Link className="cart-link" to="/gio-hang" title="Giỏ hàng">
                <span className="cart-icon-wrapper">
                  <Icon name="cart" />

                  <span className="cart-count">{cart.totalItems || 0}</span>
                </span>

                <span className="cart-text">Giỏ hàng</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link className="brand footer-brand" to="/">
              <span className="brand-drop">◆</span>
              <span>
                <b
                  style={{
                    fontWeight: "bold",
                    fontStyle: "italic",
                  }}
                >
                  CTCP Xử Lý Nước
                </b>
                <small>MINH PHÁT</small>
              </span>
            </Link>
            <p>
              Giải pháp kiểm tra và lắp đặt máy lọc nước đáng tin cậy cho mọi
              gia đình Việt.
            </p>
          </div>
          <div>
            <h4>Danh mục</h4>
            <Link to="/san-pham?category=but-thu-nuoc">Bút thử nước</Link>
            <Link to="/san-pham?category=loi-loc-nuoc">Lõi lọc nước</Link>
            <Link to="/san-pham?category=may-loc-nuoc">Máy lọc nước</Link>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <span>Hotline: 0977148627</span>
            <span>Email: manhcuongnguyen2205@gmail.com</span>
            <span>Thứ 2 - Chủ nhật: 8:00 - 21:00</span>
          </div>
          <div>
            <h4>Cam kết</h4>
            <span>Hàng chính hãng</span>
            <span>Đổi trả minh bạch</span>
            <span>Bảo hành tận nơi</span>
          </div>
        </div>
        <div className="footer-bottom">© 2026 CTCP Xử Lý Nước Minh Phát.</div>
      </footer>
    </div>
  );
}
