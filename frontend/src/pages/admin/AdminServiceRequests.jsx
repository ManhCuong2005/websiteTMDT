import { useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../../services/api";
import { dateTime } from "../../services/format";
import { Icon } from "../../components/Icons";
import { useLanguage } from "../../contexts/LanguageContext";
import UserAvatar from "../../components/UserAvatar";

const statuses = ["", "NEW", "CONTACTED", "ASSIGNED", "STAFF_COMPLETED", "DISPUTED", "COMPLETED", "CANCELLED"];

const statusLabel = {
  NEW: "Mới tiếp nhận",
  CONTACTED: "Đã liên hệ",
  ASSIGNED: "Đã giao nhân viên",
  STAFF_COMPLETED: "Chờ khách xác nhận",
  DISPUTED: "Có khiếu nại",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

const terminalStatuses = new Set(["COMPLETED", "CANCELLED"]);
const assignableStatuses = new Set(["NEW", "CONTACTED", "ASSIGNED", "DISPUTED"]);

export default function AdminServiceRequests() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [staffDrafts, setStaffDrafts] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [requestsResponse, staffResponse] = await Promise.all([
        api.get("/admin/service-requests", {
          params: { status: status || undefined, search: search.trim() || undefined, size: 100 },
        }),
        api.get("/admin/staff"),
      ]);
      const nextItems = Array.isArray(requestsResponse.data?.content) ? requestsResponse.data.content : [];
      setItems(nextItems);
      setStaff(Array.isArray(staffResponse.data) ? staffResponse.data : []);
      setStaffDrafts((current) => {
        const next = { ...current };
        nextItems.forEach((item) => {
          if (next[item.id] === undefined) next[item.id] = item.assignedStaffId || "";
        });
        return next;
      });
    } catch (err) {
      setItems([]);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [status]);

  const stats = useMemo(() => ({
    total: items.length,
    newItems: items.filter((item) => item.status === "NEW").length,
    assigned: items.filter((item) => item.status === "ASSIGNED").length,
    waiting: items.filter((item) => item.status === "STAFF_COMPLETED").length,
    disputed: items.filter((item) => item.status === "DISPUTED").length,
    reviewed: items.filter((item) => item.review).length,
    averageRating: items.some((item) => item.review)
      ? items
          .filter((item) => item.review)
          .reduce((total, item) => total + Number(item.review.rating || 0), 0)
          / items.filter((item) => item.review).length
      : 0,
  }), [items]);

  const replaceItem = (updated) => {
    setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
  };

  const contactCustomer = async (item) => {
    setBusyId(item.id);
    try {
      const updated = (await api.patch(`/admin/service-requests/${item.id}/contact`, {
        adminNote: noteDrafts[item.id] ?? item.adminNote ?? "",
      })).data;
      replaceItem(updated);
      setNoteDrafts((current) => ({ ...current, [updated.id]: updated.adminNote || "" }));
      window.location.href = `tel:${item.phone}`;
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const cancelRequest = async (item) => {
    if (!window.confirm(t("Bạn chắc chắn muốn hủy yêu cầu dịch vụ này?"))) return;
    setBusyId(item.id);
    try {
      const updated = (await api.patch(`/admin/service-requests/${item.id}/cancel`, {
        adminNote: noteDrafts[item.id] ?? item.adminNote ?? "",
      })).data;
      replaceItem(updated);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const assignStaff = async (item) => {
    const staffId = staffDrafts[item.id];
    if (!staffId) {
      alert(t("Vui lòng chọn nhân viên trước khi giao việc."));
      return;
    }
    setBusyId(item.id);
    try {
      const updated = (await api.patch(`/admin/service-requests/${item.id}/assign`, {
        staffId: Number(staffId),
      })).data;
      replaceItem(updated);
      await load();
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
          <span className="eyebrow">ĐIỀU PHỐI DỊCH VỤ</span>
          <h1>Yêu cầu đặt lịch</h1>
          <p>Admin tiếp nhận, liên hệ, giao nhân viên hoặc hủy yêu cầu. Phần thực hiện do nhân viên phụ trách.</p>
        </div>
        <button className="admin-refresh" onClick={load} disabled={loading}>
          <Icon name="refresh" size={16} /> {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="order-admin-stats service-admin-stats">
        <article><span>Tổng yêu cầu</span><b>{stats.total}</b></article>
        <article><span>Mới tiếp nhận</span><b>{stats.newItems}</b></article>
        <article><span>Đã giao việc</span><b>{stats.assigned}</b></article>
        <article><span>Chờ khách xác nhận</span><b>{stats.waiting}</b></article>
        <article className={stats.disputed ? "attention" : ""}><span>Khiếu nại</span><b>{stats.disputed}</b></article>
        <article className="rating-stat">
          <span>Đánh giá dịch vụ</span>
          <b>{stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "—"}</b>
          <small>{stats.reviewed} lượt đánh giá</small>
        </article>
      </div>

      <section className="admin-panel">
        <div className="table-toolbar admin-orders-toolbar">
          <div className="filter-tabs">
            {statuses.map((item) => (
              <button key={item || "all"} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>
                {item ? statusLabel[item] : "Tất cả"}
              </button>
            ))}
          </div>
          <form onSubmit={submitSearch}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, SĐT, địa chỉ, dịch vụ..." />
            <button type="submit">Tìm</button>
          </form>
        </div>

        {error && <div className="empty-state compact error-state">{error}</div>}
        {!error && loading ? (
          <div className="empty-state compact">Đang tải yêu cầu đặt lịch...</div>
        ) : !error && items.length === 0 ? (
          <div className="empty-state compact">Chưa có yêu cầu phù hợp với bộ lọc hiện tại.</div>
        ) : (
          !error && (
            <div className="service-request-list">
              {items.map((item) => {
                const terminal = terminalStatuses.has(item.status);
                const canAssign = assignableStatuses.has(item.status);
                return (
                  <article className={`service-request-card admin-service-${item.status.toLowerCase()}`} key={item.id}>
                    <div className="service-request-head">
                      <div>
                        <span className="eyebrow">#{item.id} · {dateTime(item.createdAt)}</span>
                        <h3>{item.serviceType}</h3>
                        <div className="service-request-customer">
                          <UserAvatar avatarUrl={item.customerAvatarUrl} name={item.fullName} size={32} />
                          <span>{item.fullName} · {item.phone} · {item.customerEmail}</span>
                        </div>
                      </div>
                      <span className={`status service-status-${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span>
                    </div>

                    {item.status === "DISPUTED" && (
                      <div className="admin-dispute-banner">
                        <Icon name="message" />
                        <div><b>Khách hàng yêu cầu xử lý lại</b><p>{item.complaint}</p></div>
                      </div>
                    )}

                    <div className="service-request-info">
                      <div><b>Địa chỉ</b><span>{item.address}</span></div>
                      <div><b>Thời gian mong muốn</b><span>{item.preferredTime || "Chưa chọn"}</span></div>
                      <div>
                        <b>Nhân viên phụ trách</b>
                        <span className="inline-user-identity">
                          {item.assignedStaffName && (
                            <UserAvatar
                              avatarUrl={item.assignedStaffAvatarUrl}
                              name={item.assignedStaffName}
                              size={25}
                            />
                          )}
                          <span>{item.assignedStaffName || "Chưa giao việc"}</span>
                        </span>
                      </div>
                      <div><b>Đã liên hệ lúc</b><span>{dateTime(item.contactedAt)}</span></div>
                      <div><b>Nhân viên báo xong</b><span>{dateTime(item.staffCompletedAt)}</span></div>
                      <div><b>Khách xác nhận</b><span>{dateTime(item.customerConfirmedAt)}</span></div>
                    </div>

                    {item.note && <p className="service-customer-note"><b>Ghi chú khách:</b> {item.note}</p>}
                    {item.staffResultNote && <p className="service-result-note"><b>Kết quả nhân viên:</b> {item.staffResultNote}</p>}
                    {item.review ? (
                      <div className="admin-service-review">
                        <div className="admin-service-review-head">
                          <UserAvatar
                            avatarUrl={item.review.customerAvatarUrl}
                            name={item.review.customerName}
                            size={38}
                          />
                          <div>
                            <b>{item.review.customerName}</b>
                            <small>Đánh giá lúc {dateTime(item.review.createdAt)}</small>
                          </div>
                          <span className="admin-review-score">
                            <strong>{Number(item.review.rating).toFixed(1)}</strong>
                            <span>{"★".repeat(item.review.rating)}{"☆".repeat(5 - item.review.rating)}</span>
                          </span>
                        </div>
                        <p>“{item.review.content}”</p>
                      </div>
                    ) : item.status === "COMPLETED" && (
                      <div className="admin-review-pending">
                        <Icon name="star" size={17} />
                        <span>Khách đã xác nhận hoàn thành nhưng chưa gửi đánh giá.</span>
                      </div>
                    )}

                    {!terminal && (
                      <div className="admin-service-control">
                        <label className="service-admin-note">
                          Ghi chú điều phối
                          <textarea
                            value={noteDrafts[item.id] ?? item.adminNote ?? ""}
                            onChange={(event) => setNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                            placeholder="Nội dung liên hệ hoặc lý do hủy (nếu có)..."
                          />
                        </label>

                        {canAssign && (
                          <div className="admin-assign-control">
                            <label>Nhân viên xử lý
                              <select
                                value={staffDrafts[item.id] ?? item.assignedStaffId ?? ""}
                                onChange={(event) => setStaffDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                                disabled={busyId === item.id}
                              >
                                <option value="">Chọn nhân viên</option>
                                {staff.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.fullName} · {member.openTasks} việc đang mở
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button className="btn btn-primary" disabled={busyId === item.id} onClick={() => assignStaff(item)}>
                              <Icon name="tool" size={16} /> {item.assignedStaffId ? "Giao lại việc" : "Giao việc"}
                            </button>
                          </div>
                        )}

                        <div className="service-request-actions admin-service-actions">
                          <button className="contact" disabled={busyId === item.id} onClick={() => contactCustomer(item)}>
                            <Icon name="message" size={15} /> Liên hệ khách
                          </button>
                          <button className="cancel" disabled={busyId === item.id} onClick={() => cancelRequest(item)}>
                            Hủy yêu cầu
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )
        )}
      </section>
    </div>
  );
}
