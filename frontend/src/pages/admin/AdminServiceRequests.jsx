import { useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../../services/api";
import { dateTime } from "../../services/format";
import { Icon } from "../../components/Icons";

const statuses = ["", "NEW", "CONTACTED", "SCHEDULED", "DONE", "CANCELLED"];

const statusLabel = {
  NEW: "Mới gửi",
  CONTACTED: "Đã liên hệ",
  SCHEDULED: "Đã hẹn lịch",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export default function AdminServiceRequests() {
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [requestsResponse, staffResponse] = await Promise.all([
        api.get("/admin/service-requests", {
          params: {
            status: status || undefined,
            search: search.trim() || undefined,
            size: 100,
          },
        }),
        api.get("/admin/staff"),
      ]);
      setItems(Array.isArray(requestsResponse.data?.content) ? requestsResponse.data.content : []);
      setStaff(Array.isArray(staffResponse.data) ? staffResponse.data : []);
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
    scheduled: items.filter((item) => item.status === "SCHEDULED").length,
    done: items.filter((item) => item.status === "DONE").length,
  }), [items]);

  const replaceItem = (updated) => {
    setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
  };

  const updateStatus = async (item, nextStatus) => {
    setBusyId(item.id);
    try {
      const updated = (await api.patch(`/admin/service-requests/${item.id}/status`, {
        status: nextStatus,
        adminNote: noteDrafts[item.id] ?? item.adminNote ?? "",
      })).data;
      replaceItem(updated);
      setNoteDrafts((current) => ({ ...current, [updated.id]: updated.adminNote || "" }));
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const assignStaff = async (item, staffId) => {
    setBusyId(item.id);
    try {
      const updated = (await api.patch(`/admin/service-requests/${item.id}/assign`, {
        staffId: staffId ? Number(staffId) : null,
      })).data;
      replaceItem(updated);
      load();
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
          <span className="eyebrow">DỊCH VỤ TẬN NHÀ</span>
          <h1>Yêu cầu tư vấn</h1>
        </div>
        <button className="admin-refresh" onClick={load} disabled={loading}>
          <Icon name="tool" size={16} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="order-admin-stats">
        <article><span>Tổng yêu cầu</span><b>{stats.total}</b></article>
        <article><span>Mới gửi</span><b>{stats.newItems}</b></article>
        <article><span>Đã hẹn lịch</span><b>{stats.scheduled}</b></article>
        <article><span>Hoàn tất</span><b>{stats.done}</b></article>
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
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên, SĐT, địa chỉ, dịch vụ..."
            />
            <button type="submit">Tìm</button>
          </form>
        </div>

        {error && <div className="empty-state compact error-state">{error}</div>}
        {!error && loading ? (
          <div className="empty-state compact">Đang tải yêu cầu tư vấn...</div>
        ) : !error && items.length === 0 ? (
          <div className="empty-state compact">Chưa có yêu cầu phù hợp với bộ lọc hiện tại.</div>
        ) : (
          !error && (
            <div className="service-request-list">
              {items.map((item) => (
                <article className="service-request-card" key={item.id}>
                  <div className="service-request-head">
                    <div>
                      <span className="eyebrow">#{item.id} · {dateTime(item.createdAt)}</span>
                      <h3>{item.serviceType}</h3>
                      <p>{item.fullName} · {item.phone}</p>
                    </div>
                    <span className={`status service-status-${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span>
                  </div>

                  <div className="staff-assign-row">
                    <label>
                      Nhân viên xử lý
                      <select
                        value={item.assignedStaffId || ""}
                        onChange={(event) => assignStaff(item, event.target.value)}
                        disabled={busyId === item.id}
                      >
                        <option value="">Chưa giao nhân viên</option>
                        {staff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName} · {member.openTasks} việc đang mở
                          </option>
                        ))}
                      </select>
                    </label>
                    <div>
                      <b>{item.assignedStaffName || "Chưa có người phụ trách"}</b>
                      <span>{item.assignedStaffEmail || "Chọn nhân viên role STAFF để giao việc"}</span>
                    </div>
                  </div>

                  <div className="service-request-info">
                    <div><b>Email</b><span>{item.customerEmail}</span></div>
                    <div><b>Địa chỉ</b><span>{item.address}</span></div>
                    <div><b>Thời gian mong muốn</b><span>{item.preferredTime || "Chưa chọn"}</span></div>
                    <div><b>Đã giao lúc</b><span>{dateTime(item.assignedAt)}</span></div>
                    <div><b>Đã liên hệ lúc</b><span>{dateTime(item.contactedAt)}</span></div>
                    <div><b>Hoàn tất lúc</b><span>{dateTime(item.completedAt)}</span></div>
                  </div>

                  {item.note && <p className="service-customer-note"><b>Ghi chú khách:</b> {item.note}</p>}

                  <label className="service-admin-note">
                    Ghi chú xử lý
                    <textarea
                      value={noteDrafts[item.id] ?? item.adminNote ?? ""}
                      onChange={(event) => setNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Ví dụ: Đã gọi khách, hẹn 9h sáng thứ 7..."
                    />
                  </label>

                  <div className="service-request-actions">
                    {statuses.filter(Boolean).map((next) => (
                      <button
                        key={next}
                        className={item.status === next ? "active" : ""}
                        disabled={busyId === item.id}
                        onClick={() => updateStatus(item, next)}
                      >
                        {statusLabel[next]}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
}
