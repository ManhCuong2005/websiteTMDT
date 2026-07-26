import { useEffect, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

const empty = { name: '', slug: '', description: '', displayOrder: 0, active: true }
export default function AdminCategories() {
  const { t } = useLanguage()
  const [items, setItems] = useState([]); const [form, setForm] = useState(empty); const [editing, setEditing] = useState(null)
  const load = () => api.get('/admin/categories').then(r => setItems(r.data))
  useEffect(() => { load() }, [])
  const edit = x => { setEditing(x.id); setForm({ name: x.name, slug: x.slug, description: x.description || '', displayOrder: x.displayOrder, active: x.active }) }
  const reset = () => { setEditing(null); setForm(empty) }
  const submit = async e => { e.preventDefault(); try { editing ? await api.put(`/admin/categories/${editing}`, form) : await api.post('/admin/categories', form); reset(); load() } catch (err) { alert(errorMessage(err)) } }
  const remove = async id => { if (confirm(t('Xóa hoặc ẩn danh mục này?'))) { await api.delete(`/admin/categories/${id}`); load() } }
  return <div className="admin-page"><div className="admin-heading"><div><span className="eyebrow">PHÂN NHÓM SẢN PHẨM</span><h1>Danh mục</h1></div></div><div className="admin-grid-two align-start"><section className="admin-panel admin-form-panel"><h2>{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2><form onSubmit={submit}><label>Tên danh mục<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label><label>Slug (có thể để trống)<input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}/></label><label>Mô tả<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label><label>Thứ tự hiển thị<input type="number" min="0" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })}/></label><label className="checkbox-label"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}/> Đang hoạt động</label><div className="form-actions"><button className="btn btn-primary">{editing ? 'Lưu' : 'Thêm danh mục'}</button>{editing && <button type="button" className="btn btn-soft" onClick={reset}>Hủy</button>}</div></form></section><section className="admin-panel"><h2>Danh sách danh mục</h2><div className="category-admin-list">{items.map(x => <article key={x.id}><div className="category-number">{x.displayOrder}</div><div><b>{x.name}</b><small>/{x.slug}</small><p>{x.description}</p></div><span className={x.active ? 'status status-delivered' : 'status status-cancelled'}>{x.active ? 'Hiện' : 'Ẩn'}</span><div className="row-actions"><button onClick={() => edit(x)}>Sửa</button><button className="danger-link" onClick={() => remove(x.id)}>Xóa</button></div></article>)}</div></section></div></div>
}
