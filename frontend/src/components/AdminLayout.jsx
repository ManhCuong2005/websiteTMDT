import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "./Icons";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

const links = [
  ["dashboard", "dashboard", "Tổng quan"],
  ["products", "package", "Sản phẩm"],
  ["categories", "tag", "Danh mục"],
  ["orders", "truck", "Đơn hàng"],
  ["service-requests", "tool", "Yêu cầu tư vấn"],
  ["coupons", "tag", "Mã giảm giá"],
  ["users", "user", "Người dùng"],
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const { language, setLanguage, isEnglish, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (!window.confirm(t("Bạn có chắc chắn muốn đăng xuất không?"))) return;
    logout();
  };

  return (
    <div className="admin-shell container">
      <aside className="admin-sidebar">
        <div className="admin-title">
          <span>MP</span>
          <div>
            <b>QUẢN TRỊ</b>
            <small>Bán Hàng</small>
          </div>
        </div>
        <nav>
          {links.map(([path, icon, label]) => (
            <NavLink key={path} to={`/admin/${path}`}>
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-tools">
          <div className="admin-preference-actions">
            <button
              type="button"
              onClick={() => setLanguage(isEnglish ? "vi" : "en")}
              title={isEnglish ? "Chuyển sang tiếng Việt" : "Chuyển sang tiếng Anh"}
              aria-label={isEnglish ? "Chuyển sang tiếng Việt" : "Chuyển sang tiếng Anh"}
            >
              {language.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
              aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            >
              <Icon name={isDark ? "sun" : "moon"} size={17} />
            </button>
          </div>
          <NavLink className="back-store" to="/">← Về cửa hàng</NavLink>
          <button className="admin-logout" type="button" onClick={handleLogout}>
            <Icon name="logout" size={17} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <section className="admin-content"><Outlet /></section>
    </div>
  );
}
