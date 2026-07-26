import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../services/api";
import { dateTime } from "../../services/format";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../../components/Icons";
import UserAvatar from "../../components/UserAvatar";

const statusLabel = {
  ASSIGNED: "Đang thực hiện",
  STAFF_COMPLETED: "Chờ khách xác nhận",
  COMPLETED: "Khách đã xác nhận",
  DISPUTED: "Cần xử lý lại",
  CANCELLED: "Đã hủy",
};

const isOpen = (task) =>
  task.status === "ASSIGNED" || task.status === "DISPUTED";
const isWaiting = (task) => task.status === "STAFF_COMPLETED";
const isClosed = (task) =>
  task.status === "COMPLETED" || task.status === "CANCELLED";

export default function StaffTasksPage() {
  const { user, logout } = useAuth();
  const { language, setLanguage, isEnglish, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
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
      setTasks(
        Array.isArray(response.data?.content) ? response.data.content : [],
      );
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

  const stats = useMemo(
    () => ({
      open: tasks.filter(isOpen).length,
      waiting: tasks.filter(isWaiting).length,
      done: tasks.filter(isClosed).length,
      total: tasks.length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    const filtered =
      filter === "waiting"
        ? tasks.filter(isWaiting)
        : filter === "done"
          ? tasks.filter(isClosed)
          : tasks.filter(isOpen);
    return [...filtered].sort((a, b) => {
      const left = new Date(
        filter === "done"
          ? a.completedAt || a.updatedAt
          : a.assignedAt || a.createdAt,
      ).getTime();
      const right = new Date(
        filter === "done"
          ? b.completedAt || b.updatedAt
          : b.assignedAt || b.createdAt,
      ).getTime();
      return filter === "done" ? right - left : left - right;
    });
  }, [tasks, filter]);

  const complete = async (task) => {
    setBusyId(task.id);
    try {
      const updated = (
        await api.patch(`/staff/tasks/${task.id}/complete`, {
          resultNote: notes[task.id] ?? task.staffResultNote ?? "",
        })
      ).data;
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotes((current) => ({
        ...current,
        [updated.id]: updated.staffResultNote || "",
      }));
      setFilter("waiting");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const contact = async (task) => {
    setBusyId(task.id);
    try {
      const updated = (await api.patch(`/staff/tasks/${task.id}/contact`)).data;
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      window.location.href = `tel:${task.phone}`;
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    if (!window.confirm(t("Bạn có chắc chắn muốn đăng xuất không?"))) return;
    logout();
  };

  return (
    <div className="staff-workspace">
      <header className="staff-topbar">
        <div>
          <span className="eyebrow">MINH PHÁT SERVICE</span>
          <h1>Công việc nhân viên</h1>
          <div className="staff-current-user">
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              name={user?.fullName}
              size={32}
            />
            <p>
              {user?.fullName || "Nhân viên"} · chỉ hiển thị các yêu cầu được
              giao cho bạn.
            </p>
          </div>
        </div>
        <div className="staff-topbar-actions">
          <button
            className="staff-preference-button"
            type="button"
            onClick={() => setLanguage(isEnglish ? "vi" : "en")}
            title={
              isEnglish ? "Chuyển sang tiếng Việt" : "Chuyển sang tiếng Anh"
            }
            aria-label={
              isEnglish ? "Chuyển sang tiếng Việt" : "Chuyển sang tiếng Anh"
            }
          >
            {language.toUpperCase()}
          </button>
          <button
            className="staff-preference-button"
            type="button"
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
            <Icon name={isDark ? "sun" : "moon"} size={17} />
          </button>
          <button className="btn btn-soft" onClick={load} disabled={loading}>
            <Icon name="calendar" size={16} />
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
          <Link className="btn btn-soft" to="/">
            Về cửa hàng
          </Link>
          <button className="btn btn-outline" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="staff-main">
        <section className="staff-stat-grid">
          <article>
            <Icon name="tool" />
            <span>Đang thực hiện</span>
            <b>{stats.open}</b>
          </article>
          <article>
            <Icon name="calendar" />
            <span>Chờ khách xác nhận</span>
            <b>{stats.waiting}</b>
          </article>
          <article>
            <Icon name="shield" />
            <span>Đã khép lại</span>
            <b>{stats.done}</b>
          </article>
          <article>
            <Icon name="calendar" />
            <span>Tổng việc được giao</span>
            <b>{stats.total}</b>
          </article>
        </section>

        <section className="staff-board">
          <div className="staff-board-head">
            <div>
              <span className="eyebrow">DANH SÁCH VIỆC</span>
              <h2>
                {filter === "done"
                  ? "Công việc đã khép lại"
                  : filter === "waiting"
                    ? "Chờ khách hàng xác nhận"
                    : "Công việc cần xử lý"}
              </h2>
              <p>
                {filter === "done"
                  ? "Các công việc đã được khách xác nhận hoặc đã hủy."
                  : filter === "waiting"
                    ? "Nhân viên đã báo xong và đang chờ phản hồi từ khách hàng."
                    : "Việc được giao cũ nhất nằm trên cùng để xử lý theo đúng thứ tự."}
              </p>
            </div>
            <div className="staff-filter-tabs">
              <button
                className={filter === "open" ? "active" : ""}
                onClick={() => setFilter("open")}
              >
                Đang thực hiện
              </button>
              <button
                className={filter === "waiting" ? "active" : ""}
                onClick={() => setFilter("waiting")}
              >
                Chờ xác nhận
              </button>
              <button
                className={filter === "done" ? "active" : ""}
                onClick={() => setFilter("done")}
              >
                Đã hoàn thành
              </button>
            </div>
          </div>

          {error && (
            <div className="empty-state compact error-state">{error}</div>
          )}
          {!error && loading ? (
            <div className="empty-state compact">
              Đang tải danh sách công việc...
            </div>
          ) : !error && visibleTasks.length === 0 ? (
            <div className="staff-empty">
              <Icon name="calendar" />
              <h2>
                {filter === "done"
                  ? "Chưa có việc đã khép lại"
                  : filter === "waiting"
                    ? "Không có việc chờ xác nhận"
                    : "Không có việc đang mở"}
              </h2>
              <p>
                {filter === "done"
                  ? "Lịch sử công việc sẽ xuất hiện tại đây."
                  : filter === "waiting"
                    ? "Công việc bạn báo hoàn thành sẽ xuất hiện tại đây."
                    : "Các việc mới được admin giao sẽ xuất hiện tại đây."}
              </p>
            </div>
          ) : (
            !error && (
              <div className="staff-task-list">
                {visibleTasks.map((task) => {
                  const active = isOpen(task);
                  const finished = !active;
                  return (
                    <article
                      className={
                        finished ? "staff-task-card done" : "staff-task-card"
                      }
                      key={task.id}
                    >
                      <div className="staff-task-head">
                        <div>
                          <span className="eyebrow">
                            #{task.id} · giao lúc {dateTime(task.assignedAt)}
                          </span>
                          <h2>{task.serviceType}</h2>
                          <div className="staff-task-customer">
                            <UserAvatar
                              avatarUrl={task.customerAvatarUrl}
                              name={task.fullName}
                              size={30}
                            />
                            <span>
                              {task.fullName} · {task.phone}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`status service-status-${task.status.toLowerCase()}`}
                        >
                          {statusLabel[task.status]}
                        </span>
                      </div>

                      <div className="service-request-info">
                        <div>
                          <b>Địa chỉ</b>
                          <span>{task.address}</span>
                        </div>
                        <div>
                          <b>Thời gian mong muốn</b>
                          <span>{task.preferredTime || "Chưa chọn"}</span>
                        </div>
                        <div>
                          <b>Email khách</b>
                          <span>{task.customerEmail}</span>
                        </div>
                        <div>
                          <b>Đã liên hệ lúc</b>
                          <span>{dateTime(task.staffContactedAt)}</span>
                        </div>
                        <div>
                          <b>Báo hoàn thành lúc</b>
                          <span>{dateTime(task.staffCompletedAt)}</span>
                        </div>
                        <div>
                          <b>Khách xác nhận lúc</b>
                          <span>{dateTime(task.customerConfirmedAt)}</span>
                        </div>
                      </div>

                      {task.note && (
                        <p className="service-customer-note">
                          <b>Ghi chú khách:</b> {task.note}
                        </p>
                      )}
                      {task.complaint && (
                        <div className="staff-complaint">
                          <Icon name="message" />
                          <div>
                            <b>Khách yêu cầu xử lý lại</b>
                            <p>{task.complaint}</p>
                          </div>
                        </div>
                      )}

                      <label className="service-admin-note">
                        Ghi chú kết quả
                        <textarea
                          value={notes[task.id] ?? task.staffResultNote ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [task.id]: event.target.value,
                            }))
                          }
                          placeholder="Ví dụ: Đã thay lõi số 1, khách hẹn kiểm tra lại sau 3 tháng..."
                          disabled={!active}
                        />
                      </label>

                      <div className="staff-task-actions">
                        <button
                          className="btn btn-soft"
                          disabled={!active || busyId === task.id}
                          onClick={() => contact(task)}
                        >
                          <Icon name="message" size={16} /> Liên hệ khách
                        </button>
                        <button
                          className="btn btn-primary"
                          disabled={!active || busyId === task.id}
                          onClick={() => complete(task)}
                        >
                          {!active
                            ? statusLabel[task.status]
                            : busyId === task.id
                              ? "Đang lưu..."
                              : "Báo đã hoàn thành"}
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
