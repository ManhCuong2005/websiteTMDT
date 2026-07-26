import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { dateTime } from "../services/format";
import { Icon } from "../components/Icons";
import { useLanguage } from "../contexts/LanguageContext";
import UserAvatar from "../components/UserAvatar";

const statusLabel = {
  NEW: "Mới tiếp nhận",
  CONTACTED: "Đã liên hệ",
  ASSIGNED: "Đã giao kỹ thuật viên",
  STAFF_COMPLETED: "Chờ bạn xác nhận",
  COMPLETED: "Đã hoàn tất",
  DISPUTED: "Đang xử lý khiếu nại",
  CANCELLED: "Đã hủy",
};

const editableStatuses = new Set(["NEW", "CONTACTED", "ASSIGNED"]);
const activeStatuses = new Set(["NEW", "CONTACTED", "ASSIGNED", "DISPUTED"]);

const createDraft = (item) => ({
  address: item.address || "",
  preferredTime: item.preferredTime || "",
  note: item.note || "",
});

export default function ServiceHistoryPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState("");
  const [complaint, setComplaint] = useState("");
  const [review, setReview] = useState({ rating: 5, content: "" });
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/service-requests/my", { params: { size: 100 } });
      setItems(Array.isArray(response.data?.content) ? response.data.content : []);
    } catch (err) {
      setItems([]);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleItems = useMemo(() => items.filter((item) => {
    if (filter === "active") return activeStatuses.has(item.status);
    if (filter === "waiting") return item.status === "STAFF_COMPLETED";
    if (filter === "completed") return item.status === "COMPLETED";
    return true;
  }), [filter, items]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => activeStatuses.has(item.status)).length,
    waiting: items.filter((item) => item.status === "STAFF_COMPLETED").length,
    completed: items.filter((item) => item.status === "COMPLETED").length,
  }), [items]);

  const replaceItem = (updated) => {
    setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
  };

  const beginEdit = (item) => {
    setEditingId(item.id);
    setDraft(createDraft(item));
    setActionId(null);
  };

  const saveEdit = async (item) => {
    setBusyId(item.id);
    try {
      const updated = (await api.put(`/service-requests/${item.id}`, draft)).data;
      replaceItem(updated);
      setEditingId(null);
      setDraft(null);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmCompleted = async (item) => {
    if (!window.confirm(t("Bạn xác nhận kỹ thuật viên đã hoàn thành dịch vụ?"))) return;
    setBusyId(item.id);
    try {
      const updated = (await api.patch(`/service-requests/${item.id}/confirm`)).data;
      replaceItem(updated);
      setActionId(item.id);
      setActionType("review");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openAction = (item, type) => {
    setActionId(item.id);
    setActionType(type);
    setEditingId(null);
    setComplaint(item.complaint || "");
    setReview({ rating: 5, content: "" });
  };

  const submitDispute = async (event, item) => {
    event.preventDefault();
    setBusyId(item.id);
    try {
      const updated = (await api.patch(`/service-requests/${item.id}/dispute`, { complaint })).data;
      replaceItem(updated);
      setActionId(null);
      setComplaint("");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const submitReview = async (event, item) => {
    event.preventDefault();
    setBusyId(item.id);
    try {
      await api.post(`/service-requests/${item.id}/review`, review);
      await load();
      setActionId(null);
      setReview({ rating: 5, content: "" });
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-section container service-history-page">
      <div className="service-history-hero">
        <div>
          <span className="eyebrow">DỊCH VỤ CỦA TÔI</span>
          <h1>Lịch sử đặt lịch</h1>
          <p>Theo dõi tiến độ, cập nhật thông tin và xác nhận chất lượng sau khi kỹ thuật viên hoàn thành.</p>
        </div>
        <Link className="btn btn-primary" to="/dat-lich">
          <Icon name="calendar" size={17} /> Đặt lịch mới
        </Link>
      </div>

      <div className="service-history-stats">
        <article><span>Tổng yêu cầu</span><b>{stats.total}</b></article>
        <article><span>Đang xử lý</span><b>{stats.active}</b></article>
        <article><span>Chờ xác nhận</span><b>{stats.waiting}</b></article>
        <article><span>Đã hoàn tất</span><b>{stats.completed}</b></article>
      </div>

      <div className="service-history-toolbar">
        {[
          ["all", "Tất cả"],
          ["active", "Đang xử lý"],
          ["waiting", "Chờ xác nhận"],
          ["completed", "Đã hoàn tất"],
        ].map(([value, label]) => (
          <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
        <button className="history-refresh" onClick={load} disabled={loading}>
          <Icon name="refresh" size={15} /> Làm mới
        </button>
      </div>

      {error && <div className="empty-state error-state">{error}</div>}
      {!error && loading ? (
        <div className="empty-state">Đang tải lịch sử đặt lịch...</div>
      ) : !error && visibleItems.length === 0 ? (
        <div className="empty-state service-history-empty">
          <Icon name="calendar" size={32} />
          <h2>Chưa có lịch phù hợp</h2>
          <p>Các yêu cầu dịch vụ của bạn sẽ xuất hiện tại đây.</p>
          <Link className="btn btn-primary" to="/dat-lich">Đặt lịch kỹ thuật viên</Link>
        </div>
      ) : (
        <div className="service-history-list">
          {visibleItems.map((item) => {
            const isEditing = editingId === item.id;
            const showingAction = actionId === item.id;
            return (
              <article className={`customer-service-card customer-service-${item.status.toLowerCase()}`} key={item.id}>
                <header className="customer-service-head">
                  <div>
                    <span className="eyebrow">YÊU CẦU #{item.id} · {dateTime(item.createdAt)}</span>
                    <h2>{item.serviceType}</h2>
                    <div className="history-customer-identity">
                      <UserAvatar avatarUrl={item.customerAvatarUrl} name={item.fullName} size={30} />
                      <span>{item.fullName} · {item.phone}</span>
                    </div>
                  </div>
                  <span className={`status service-status-${item.status.toLowerCase()}`}>
                    {statusLabel[item.status] || item.status}
                  </span>
                </header>

                <div className="service-progress">
                  <div className="active"><i><Icon name="message" size={14} /></i><span>Đã gửi yêu cầu</span></div>
                  <div className={item.assignedAt ? "active" : ""}><i><Icon name="tool" size={14} /></i><span>Đã giao nhân viên</span></div>
                  <div className={item.staffCompletedAt ? "active" : ""}><i><Icon name="shield" size={14} /></i><span>Nhân viên báo xong</span></div>
                  <div className={item.customerConfirmedAt ? "active" : ""}><i><Icon name="star" size={14} /></i><span>Khách xác nhận</span></div>
                </div>

                {isEditing ? (
                  <div className="history-edit-form">
                    <div className="service-form-grid">
                      <label className="wide">Địa chỉ
                        <input required value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
                      </label>
                      <label className="wide">Thời gian mong muốn
                        <input value={draft.preferredTime} onChange={(event) => setDraft({ ...draft, preferredTime: event.target.value })} />
                      </label>
                      <label className="wide">Ghi chú
                        <textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
                      </label>
                    </div>
                    <div className="history-inline-actions">
                      <button className="btn btn-primary" disabled={busyId === item.id || !draft.address.trim()} onClick={() => saveEdit(item)}>
                        {busyId === item.id ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button className="btn btn-soft" onClick={() => setEditingId(null)}>Hủy chỉnh sửa</button>
                    </div>
                  </div>
                ) : (
                  <div className="customer-service-info">
                    <div><b>Địa chỉ</b><span>{item.address}</span></div>
                    <div><b>Thời gian mong muốn</b><span>{item.preferredTime || "Chưa chọn"}</span></div>
                    <div>
                      <b>Kỹ thuật viên</b>
                      <span className="inline-user-identity">
                        {item.assignedStaffName && (
                          <UserAvatar avatarUrl={item.assignedStaffAvatarUrl} name={item.assignedStaffName} size={25} />
                        )}
                        <span>{item.assignedStaffName || "Đang chờ phân công"}</span>
                      </span>
                    </div>
                    <div><b>Cập nhật gần nhất</b><span>{dateTime(item.updatedAt)}</span></div>
                    <div className="wide"><b>Ghi chú của bạn</b><span>{item.note || "Không có ghi chú"}</span></div>
                    {item.staffResultNote && <div className="wide result"><b>Kết quả kỹ thuật viên</b><span>{item.staffResultNote}</span></div>}
                  </div>
                )}

                {item.status === "STAFF_COMPLETED" && (
                  <div className="customer-confirm-panel">
                    <div>
                      <Icon name="shield" />
                      <span><b>Kỹ thuật viên đã báo hoàn thành</b><small>Vui lòng kiểm tra kết quả trước khi xác nhận.</small></span>
                    </div>
                    <div>
                      <button className="btn btn-primary" disabled={busyId === item.id} onClick={() => confirmCompleted(item)}>Xác nhận hoàn thành</button>
                      <button className="btn btn-outline danger" onClick={() => openAction(item, "dispute")}>Khiếu nại</button>
                    </div>
                  </div>
                )}

                {item.status === "DISPUTED" && (
                  <div className="history-alert complaint-alert">
                    <Icon name="message" />
                    <div><b>Đang xử lý khiếu nại</b><p>{item.complaint}</p></div>
                  </div>
                )}

                {item.status === "CANCELLED" && item.adminNote && (
                  <div className="history-alert"><Icon name="message" /><div><b>Lý do hủy</b><p>{item.adminNote}</p></div></div>
                )}

                {item.review ? (
                  <div className="submitted-service-review">
                    <div><span>{"★".repeat(item.review.rating)}</span><b>Đánh giá của bạn</b></div>
                    <p>{item.review.content}</p>
                  </div>
                ) : item.status === "COMPLETED" && (
                  <div className="review-invitation">
                    <div><Icon name="star" /><span><b>Dịch vụ đã hoàn tất</b><small>Chia sẻ trải nghiệm để giúp Minh Phát phục vụ tốt hơn.</small></span></div>
                    <button className="btn btn-soft" onClick={() => openAction(item, "review")}>Đánh giá chất lượng phục vụ</button>
                  </div>
                )}

                {showingAction && actionType === "dispute" && (
                  <form className="history-action-form dispute-form" onSubmit={(event) => submitDispute(event, item)}>
                    <h3>Gửi nội dung khiếu nại</h3>
                    <p>Mô tả phần việc chưa đạt để quản trị viên có thể liên hệ và xử lý chính xác.</p>
                    <textarea required maxLength="1000" value={complaint} onChange={(event) => setComplaint(event.target.value)} placeholder="Nội dung cần Minh Phát hỗ trợ thêm..." />
                    <div className="history-inline-actions">
                      <button className="btn btn-primary" disabled={busyId === item.id}>Gửi khiếu nại</button>
                      <button type="button" className="btn btn-soft" onClick={() => setActionId(null)}>Đóng</button>
                    </div>
                  </form>
                )}

                {showingAction && actionType === "review" && !item.review && (
                  <form className="history-action-form review-service-form" onSubmit={(event) => submitReview(event, item)}>
                    <h3>Đánh giá chất lượng phục vụ</h3>
                    <p>Đánh giá này sẽ được hiển thị công khai cùng tên của bạn tại trang chủ.</p>
                    <label>Mức độ hài lòng
                      <select value={review.rating} onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}>
                        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
                      </select>
                    </label>
                    <label>Nội dung đánh giá
                      <textarea required maxLength="1000" value={review.content} onChange={(event) => setReview({ ...review, content: event.target.value })} placeholder="Chia sẻ cảm nhận về kỹ thuật viên và chất lượng dịch vụ..." />
                    </label>
                    <div className="history-inline-actions">
                      <button className="btn btn-primary" disabled={busyId === item.id}>Lưu đánh giá</button>
                      <button type="button" className="btn btn-soft" onClick={() => setActionId(null)}>Đóng</button>
                    </div>
                  </form>
                )}

                {editableStatuses.has(item.status) && !isEditing && (
                  <footer className="customer-service-footer">
                    <span>Bạn có thể cập nhật địa chỉ, thời gian và ghi chú trước khi kỹ thuật viên báo hoàn thành.</span>
                    <button className="btn btn-soft" onClick={() => beginEdit(item)}>Chỉnh sửa thông tin</button>
                  </footer>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
