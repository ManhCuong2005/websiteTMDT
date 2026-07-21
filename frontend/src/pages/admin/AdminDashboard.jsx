import { useEffect, useState } from "react";
import api from "../../services/api";
import { money } from "../../services/format";
import { Icon } from "../../components/Icons";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="admin-page">Đang tải tổng quan...</div>;

  const cards = [
    ["Người dùng", data.totalUsers, "user"],
    ["Sản phẩm đang bán", data.totalProducts, "package"],
    ["Đơn chờ xác nhận", data.pendingOrders, "dashboard"],
    ["Yêu cầu tư vấn mới", data.newServiceRequests || 0, "tool"],
  ];

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">TRUNG TÂM QUẢN TRỊ</span>
          <h1>Tổng quan cửa hàng</h1>
        </div>
        <span className="today-pill">Dữ liệu hiện tại</span>
      </div>
      <div className="stat-grid">
        {cards.map(([label, value, icon]) => (
          <article key={label}>
            <div className="stat-icon"><Icon name={icon} /></div>
            <span>{label}</span>
            <b>{value}</b>
          </article>
        ))}
      </div>
      <div className="admin-grid-two">
        <section className="admin-panel revenue-panel">
          <span className="eyebrow">DOANH THU ĐÃ GIAO</span>
          <h2>{money(data.deliveredRevenue)}</h2>
          <p>Tổng giá trị các đơn hàng đã hoàn tất.</p>
          <div className="fake-chart"><i /><i /><i /><i /><i /><i /><i /></div>
        </section>
        <section className="admin-panel health-panel">
          <h2>Tình trạng vận hành</h2>
          <div><span>Người dùng hoạt động</span><b>{data.activeUsers}/{data.totalUsers}</b></div>
          <div><span>Đơn đã giao</span><b>{data.deliveredOrders}</b></div>
          <div><span>Sản phẩm sắp hết hàng</span><b className={data.lowStockProducts ? "warning-text" : ""}>{data.lowStockProducts}</b></div>
          <div><span>Yêu cầu tư vấn mới</span><b>{data.newServiceRequests || 0}</b></div>
        </section>
      </div>
    </div>
  );
}
