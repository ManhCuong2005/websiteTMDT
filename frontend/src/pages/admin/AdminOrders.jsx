import { useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../../services/api";
import { dateTime, money, statusLabel } from "../../services/format";
import { Icon } from "../../components/Icons";

const statuses = [
  "",
  "PENDING",
  "CONFIRMED",
  "PACKING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];
const activeStatuses = statuses.filter(Boolean);

const statusAction = {
  PENDING: "Chờ admin xác nhận đơn hàng",
  CONFIRMED: "Đã xác nhận, chuẩn bị xử lý",
  PACKING: "Kho đang đóng gói sản phẩm",
  SHIPPING: "Đơn đã bàn giao giao hàng",
  DELIVERED: "Đã giao thành công",
  CANCELLED: "Đơn đã hủy",
};

const nextStatus = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PACKING",
  PACKING: "SHIPPING",
  SHIPPING: "DELIVERED",
};

function countByStatus(orders, status) {
  return orders.filter((order) => order.status === status).length;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setError("");
    try {
      const response = await api.get("/admin/orders", {
        params: {
          status: status || undefined,
          search: search.trim() || undefined,
          size: 100,
        },
      });
      const content = Array.isArray(response.data?.content)
        ? response.data.content
        : [];
      setOrders(content);
      setSelectedId((current) =>
        current && content.some((order) => order.id === current)
          ? current
          : content[0]?.id || null,
      );
      setLastUpdated(new Date());
    } catch (err) {
      setOrders([]);
      setSelectedId(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [status]);

  useEffect(() => {
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [status, search]);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedId) || orders[0] || null;
  }, [orders, selectedId]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: countByStatus(orders, "PENDING"),
      processing: ["CONFIRMED", "PACKING", "SHIPPING"].reduce(
        (sum, item) => sum + countByStatus(orders, item),
        0,
      ),
      revenue: orders
        .filter((order) => order.status !== "CANCELLED")
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    }),
    [orders],
  );

  const update = async (id, next) => {
    setBusyId(id);
    try {
      const updated = (
        await api.patch(`/admin/orders/${id}/status`, { status: next })
      ).data;
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      );
      setSelectedId(updated.id);
      setLastUpdated(new Date());
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setLoading(true);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">XỬ LÝ BÁN HÀNG</span>
          <h1>Quản lý đơn hàng</h1>
        </div>
        <button className="admin-refresh" onClick={load} disabled={loading}>
          <Icon name="truck" size={16} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="order-admin-stats">
        <article>
          <span>Tổng đơn</span>
          <b>{stats.total}</b>
        </article>
        <article>
          <span>Chờ xác nhận</span>
          <b>{stats.pending}</b>
        </article>
        <article>
          <span>Đang xử lý</span>
          <b>{stats.processing}</b>
        </article>
        <article>
          <span>Giá trị đơn hiển thị</span>
          <b>{money(stats.revenue)}</b>
        </article>
      </div>

      <section className="admin-panel admin-orders-panel">
        <div className="table-toolbar admin-orders-toolbar">
          <div className="filter-tabs">
            {statuses.map((item) => (
              <button
                key={item || "all"}
                className={status === item ? "active" : ""}
                onClick={() => setStatus(item)}
              >
                {item ? statusLabel[item] : "Tất cả"}
              </button>
            ))}
          </div>
          <form onSubmit={submitSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Mã đơn, email, người nhận..."
            />
            <button type="submit">Tìm</button>
          </form>
        </div>

        {lastUpdated && (
          <p className="admin-live-note">
            Tự cập nhật mỗi 10 giây. Lần tải gần nhất: {dateTime(lastUpdated)}
          </p>
        )}

        {error && (
          <div className="empty-state compact error-state">{error}</div>
        )}

        {!error && loading ? (
          <div className="empty-state compact">
            Đang tải danh sách đơn hàng...
          </div>
        ) : !error && orders.length === 0 ? (
          <div className="empty-state compact">
            Chưa có đơn hàng phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          !error && (
            <div className="admin-orders-layout">
              <div className="order-admin-list">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className={selectedOrder?.id === order.id ? "active" : ""}
                    onClick={() => setSelectedId(order.id)}
                  >
                    <div className="order-admin-head">
                      <div>
                        <b>#{order.orderCode}</b>
                        <small>
                          {dateTime(order.createdAt)} · {order.customerName} (
                          {order.customerEmail})
                        </small>
                      </div>
                      <span
                        className={`status status-${order.status.toLowerCase()}`}
                      >
                        {statusLabel[order.status]}
                      </span>
                    </div>
                    <div className="order-admin-body">
                      <div>
                        {order.items.slice(0, 3).map((item) => (
                          <p key={item.id}>
                            <span>
                              {item.productName} × {item.quantity}
                            </span>
                            <b>{money(item.lineTotal)}</b>
                          </p>
                        ))}
                        {order.items.length > 3 && (
                          <small>+{order.items.length - 3} sản phẩm khác</small>
                        )}
                      </div>
                      <div>
                        <span>
                          Người nhận: {order.recipientName} ·{" "}
                          {order.recipientPhone}
                        </span>
                        <span>Địa chỉ: {order.shippingAddress}</span>
                        <span>
                          Thanh toán: COD / {order.paymentStatus || "PENDING"}
                        </span>
                      </div>
                    </div>
                    <div className="order-admin-foot">
                      <b>Tổng: {money(order.total)}</b>
                      <span>{statusAction[order.status]}</span>
                    </div>
                  </article>
                ))}
              </div>

              {selectedOrder && (
                <aside className="admin-order-detail">
                  <div className="admin-order-detail-head">
                    <div>
                      <span className="eyebrow">CHI TIẾT ĐƠN</span>
                      <h2>#{selectedOrder.orderCode}</h2>
                      <p>
                        {selectedOrder.customerName} ·{" "}
                        {selectedOrder.customerEmail}
                      </p>
                    </div>
                    <span
                      className={`status status-${selectedOrder.status.toLowerCase()}`}
                    >
                      {statusLabel[selectedOrder.status]}
                    </span>
                  </div>

                  <div className="admin-order-flow">
                    {activeStatuses
                      .filter((item) => item !== "CANCELLED")
                      .map((item, index) => {
                        const activeIndex = activeStatuses.indexOf(
                          selectedOrder.status,
                        );
                        const done =
                          selectedOrder.status !== "CANCELLED" &&
                          activeIndex >= index;
                        return (
                          <button
                            key={item}
                            className={done ? "done" : ""}
                            disabled={
                              busyId === selectedOrder.id ||
                              selectedOrder.status === "DELIVERED" ||
                              selectedOrder.status === "CANCELLED"
                            }
                            onClick={() => update(selectedOrder.id, item)}
                          >
                            <span>{index + 1}</span>
                            {statusLabel[item]}
                          </button>
                        );
                      })}
                  </div>

                  <div className="admin-order-actions">
                    {nextStatus[selectedOrder.status] && (
                      <button
                        className="btn btn-primary"
                        disabled={busyId === selectedOrder.id}
                        onClick={() =>
                          update(
                            selectedOrder.id,
                            nextStatus[selectedOrder.status],
                          )
                        }
                      >
                        {busyId === selectedOrder.id
                          ? "Đang cập nhật..."
                          : `Chuyển sang: ${statusLabel[nextStatus[selectedOrder.status]]}`}
                      </button>
                    )}
                    {!["DELIVERED", "CANCELLED"].includes(
                      selectedOrder.status,
                    ) && (
                      <button
                        className="btn btn-danger-small"
                        disabled={busyId === selectedOrder.id}
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Bạn có chắc chắn muốn hủy đơn hàng này không?\nHành động này không thể hoàn tác.",
                          );

                          if (confirmed) {
                            update(selectedOrder.id, "CANCELLED");
                          }
                        }}
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>

                  <div className="admin-order-info">
                    <article>
                      <b>Người nhận</b>
                      <span>{selectedOrder.recipientName}</span>
                      <small>{selectedOrder.recipientPhone}</small>
                    </article>
                    <article>
                      <b>Địa chỉ giao hàng</b>
                      <span>{selectedOrder.shippingAddress}</span>
                    </article>
                    {selectedOrder.note && (
                      <article>
                        <b>Ghi chú</b>
                        <span>{selectedOrder.note}</span>
                      </article>
                    )}
                  </div>

                  <div className="admin-order-items">
                    <h3>Sản phẩm</h3>
                    {selectedOrder.items.map((item) => (
                      <div key={item.id}>
                        <span>
                          <b>{item.productName}</b>
                          <small>
                            SKU: {item.productSku || "—"} · SL: {item.quantity}
                          </small>
                        </span>
                        <strong>{money(item.lineTotal)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-price-box admin-price-box">
                    <div>
                      <span>Tạm tính</span>
                      <b>{money(selectedOrder.subtotal)}</b>
                    </div>
                    <div>
                      <span>Giảm giá</span>
                      <b>-{money(selectedOrder.discountAmount)}</b>
                    </div>
                    <div>
                      <span>Phí giao hàng</span>
                      <b>{money(selectedOrder.shippingFee)}</b>
                    </div>
                    <div className="total">
                      <span>Tổng thanh toán</span>
                      <b>{money(selectedOrder.total)}</b>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )
        )}
      </section>
    </div>
  );
}
