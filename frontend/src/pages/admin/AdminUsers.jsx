import { useEffect, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { dateTime } from '../../services/format'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const load = () => api.get('/admin/users', { params: { size: 100 } }).then(r => setUsers(r.data.content))
  useEffect(() => { load() }, [])
  const toggle = async u => { try { await api.patch(`/admin/users/${u.id}/status`, { enabled: !u.enabled }); load() } catch (err) { alert(errorMessage(err)) } }
  return <div className="admin-page"><div className="admin-heading"><div><span className="eyebrow">TÀI KHOẢN HỆ THỐNG</span><h1>Người dùng</h1></div></div><section className="admin-panel"><div className="table-wrap"><table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Đăng nhập</th><th>Ngày tạo</th><th>Trạng thái</th><th></th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td><b>{u.fullName}</b><small>{u.email}{u.phone ? ` · ${u.phone}` : ''}</small></td><td>{u.role}</td><td>{u.provider}</td><td>{dateTime(u.createdAt)}</td><td><span className={u.enabled ? 'status status-delivered' : 'status status-cancelled'}>{u.enabled ? 'Hoạt động' : 'Đã khóa'}</span></td><td className="row-actions"><button className={u.enabled ? 'danger-link' : ''} onClick={() => toggle(u)}>{u.enabled ? 'Khóa' : 'Mở khóa'}</button></td></tr>)}</tbody></table></div></section></div>
}
