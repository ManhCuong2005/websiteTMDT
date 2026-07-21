import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "./Icons";

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
        <NavLink className="back-store" to="/">← Về cửa hàng</NavLink>
      </aside>
      <section className="admin-content"><Outlet /></section>
    </div>
  );
}
