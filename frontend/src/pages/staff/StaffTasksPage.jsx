import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../services/api";
import { dateTime } from "../../services/format";
import { useAuth } from "../../contexts/AuthContext";
import { Icon } from "../../components/Icons";

const statusLabel = {
  NEW: "Mới gửi",
  CONTACTED: "Đã liên hệ",
  SCHEDULED: "Đã hẹn lịch",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const isDone = (task) => task.status === "DONE";
const isOpen = (task) => task.status !== "DONE" && task.status !== "CANCELLED";

export default function StaffTasksPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/staff/tasks", { params: { size: 100 } });
      setTasks(Array.isArray(response.data?.content) ? response.data.content : []);
    } catch (err) {
      setTasks([]);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    open: tasks.filter(isOpen).length,
    done: tasks.filter(isDone).length,
    total: tasks.length,
  }), [tasks]);

  const visibleTasks = useMemo(() => {
    const filtered = filter === "done" ? tasks.filter(isDone) : tasks.filter(isOpen);
    return [...filtered].sort((a, b) => {
      const left = new Date(filter === "done" ? a.completedAt || a.updatedAt : a.assignedAt || a.createdAt).getTime();
      const right = new Date(filter === "done" ? b.completedAt || b.updatedAt : b.assignedAt || b.createdAt).getTime();
      return filter === "done" ? right - left : left - right;
    });
  }, [tasks, filter]);

  const complete = async (task) => {
    setBusyId(task.id);
    try {
      const updated = (await api.patch(`/staff/tasks/${task.id}/complete`, {
        status: "DONE",
        adminNote: notes[task.id] ?? task.adminNote ?? "",
      })).data;
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotes((current) => ({ ...current, [updated.id]: updated.adminNote || "" }));
      setFilter("done");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="staff-workspace">
      <header className="staff-topbar">
        <div>
          <span className="eyebrow">MINH PHÁT SERVICE</span>
          <h1>Công việc nhân viên</h1>
          <p>{user?.fullName || "Nhân viên"} · chỉ hiển thị các yêu cầu được giao cho bạn.</p>
        </div>
        <div className="staff-topbar-actions">
          <button className="btn btn-soft" onClick={load} disabled={loading}>
            <Icon name="calendar" size={16} />
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
          <Link className="btn btn-soft" to="/">Về cửa hàng</Link>
          <button className="btn btn-outline" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </header>

      <main className="staff-main">
        <section className="staff-stat-grid">
          <article><Icon name="tool" /><span>Chưa hoàn thành</span><b>{stats.open}</b></article>
          <article><Icon name="shield" /><span>Đã hoàn thành</span><b>{stats.done}</b></article>
          <article><Icon name="calendar" /><span>Tổng việc được giao</span><b>{stats.total}</b></article>
        </section>

        <section className="staff-board">
          <div className="staff-board-head">
            <div>
              <span className="eyebrow">DANH SÁCH VIỆC</span>
              <h2>{filter === "done" ? "Việc đã hoàn thành" : "Việc chưa hoàn thành"}</h2>
              <p>
                {filter === "done"
                  ? "Việc mới hoàn thành sẽ nằm trên cùng."
                  : "Việc được giao cũ nhất sẽ nằm trên cùng để xử lý theo đúng thứ tự."}
              </p>
            </div>
            <div className="staff-filter-tabs">
              <button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>
                Chưa hoàn thành
              </button>
              <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>
                Đã hoàn thành
              </button>
            </div>
          </div>

          {error && <div className="empty-state compact error-state">{error}</div>}
          {!error && loading ? (
            <div className="empty-state compact">Đang tải danh sách công việc...</div>
          ) : !error && visibleTasks.length === 0 ? (
            <div className="staff-empty">
              <Icon name="calendar" />
              <h2>{filter === "done" ? "Chưa có việc hoàn thành" : "Không có việc đang mở"}</h2>
              <p>{filter === "done" ? "Khi bạn hoàn thành công việc, lịch sử sẽ xuất hiện ở đây." : "Các việc mới được admin giao sẽ xuất hiện tại đây."}</p>
            </div>
          ) : (
            !error && (
              <div className="staff-task-list">
                {visibleTasks.map((task) => {
                  const finished = isDone(task);
                  return (
                    <article className={finished ? "staff-task-card done" : "staff-task-card"} key={task.id}>
                      <div className="staff-task-head">
                        <div>
                          <span className="eyebrow">#{task.id} · giao lúc {dateTime(task.assignedAt)}</span>
                          <h2>{task.serviceType}</h2>
                          <p>{task.fullName} · {task.phone}</p>
                        </div>
                        <span className={`status service-status-${task.status.toLowerCase()}`}>{statusLabel[task.status]}</span>
                      </div>

                      <div className="service-request-info">
                        <div><b>Địa chỉ</b><span>{task.address}</span></div>
                        <div><b>Thời gian mong muốn</b><span>{task.preferredTime || "Chưa chọn"}</span></div>
                        <div><b>Email khách</b><span>{task.customerEmail}</span></div>
                        <div><b>Hoàn tất lúc</b><span>{dateTime(task.completedAt)}</span></div>
                      </div>

                      {task.note && <p className="service-customer-note"><b>Ghi chú khách:</b> {task.note}</p>}

                      <label className="service-admin-note">
                        Ghi chú kết quả
                        <textarea
                          value={notes[task.id] ?? task.adminNote ?? ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [task.id]: event.target.value }))}
                          placeholder="Ví dụ: Đã thay lõi số 1, khách hẹn kiểm tra lại sau 3 tháng..."
                          disabled={finished}
                        />
                      </label>

                      <div className="staff-task-actions">
                        <a className="btn btn-soft" href={`tel:${task.phone}`}>Gọi khách</a>
                        <button className="btn btn-primary" disabled={finished || busyId === task.id} onClick={() => complete(task)}>
                          {finished ? "Đã hoàn thành" : busyId === task.id ? "Đang lưu..." : "Đánh dấu hoàn thành"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}
