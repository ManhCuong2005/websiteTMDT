import { useEffect, useState } from "react";
import api, { errorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { dateTime } from "../../services/format";

const roleOptions = [
  { value: "CUSTOMER", label: "Khách hàng" },
  { value: "STAFF", label: "Nhân viên" },
  { value: "ADMIN", label: "Quản trị" },
];

const roleLabel = Object.fromEntries(roleOptions.map((item) => [item.value, item.label]));

export default function AdminUsers() {
  const { user: currentUser, setUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const replaceUser = (updated) => {
    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    if (currentUser?.id === updated.id) {
      const nextUser = { ...currentUser, role: updated.role, enabled: updated.enabled };
      localStorage.setItem("banhang_user", JSON.stringify(nextUser));
      setUser(nextUser);
    }
  };

  const load = () => api.get("/admin/users", { params: { size: 100 } }).then((r) => setUsers(r.data.content || []));

  useEffect(() => {
    load().catch((err) => alert(errorMessage(err)));
  }, []);

  const toggle = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      alert("Bạn không thể tự khóa tài khoản đang đăng nhập.");
      return;
    }
    setBusyId(targetUser.id);
    try {
      const updated = (await api.patch(`/admin/users/${targetUser.id}/status`, { enabled: !targetUser.enabled })).data;
      replaceUser(updated);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const updateRole = async (targetUser, role) => {
    if (role === targetUser.role) return;
    if (targetUser.id === currentUser?.id && role !== "ADMIN") {
      alert("Bạn không thể tự hạ vai trò quản trị của chính mình.");
      return;
    }
    setBusyId(targetUser.id);
    try {
      const updated = (await api.patch(`/admin/users/${targetUser.id}/role`, { role })).data;
      replaceUser(updated);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">TÀI KHOẢN HỆ THỐNG</span>
          <h1>Người dùng</h1>
        </div>
      </div>

      <section className="admin-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Đăng nhập</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((targetUser) => {
                const isSelf = targetUser.id === currentUser?.id;
                return (
                  <tr key={targetUser.id}>
                    <td>
                      <b>{targetUser.fullName}</b>
                      <small>{targetUser.email}{targetUser.phone ? ` · ${targetUser.phone}` : ""}</small>
                    </td>
                    <td>
                      <label className="role-select-label">
                        <span>{isSelf ? "Tài khoản hiện tại" : roleLabel[targetUser.role] || targetUser.role}</span>
                        <select
                          value={targetUser.role}
                          onChange={(event) => updateRole(targetUser, event.target.value)}
                          disabled={busyId === targetUser.id || isSelf}
                          title={isSelf ? "Không thể đổi vai trò của chính mình" : "Đổi vai trò người dùng"}
                        >
                          {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                        </select>
                      </label>
                    </td>
                    <td>{targetUser.provider}</td>
                    <td>{dateTime(targetUser.createdAt)}</td>
                    <td>
                      <span className={targetUser.enabled ? "status status-delivered" : "status status-cancelled"}>
                        {targetUser.enabled ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className={targetUser.enabled ? "danger-link" : ""} onClick={() => toggle(targetUser)} disabled={busyId === targetUser.id || isSelf}>
                        {targetUser.enabled ? "Khóa" : "Mở khóa"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
