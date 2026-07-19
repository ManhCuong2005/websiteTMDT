import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { errorMessage } from '../services/api'

export default function RegisterPage() {
  const { user, register, verifyRegistration } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [code, setCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return alert('Mat khau xac nhan khong khop')
    setBusy(true)
    try {
      const response = await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      setPendingEmail(response.email)
      setNotice(response.message || 'Ma xac thuc da duoc gui den email cua ban')
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await verifyRegistration({ email: pendingEmail, code })
      navigate('/')
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const changeEmail = () => {
    setPendingEmail('')
    setCode('')
    setNotice('')
  }

  return (
    <div className="auth-page">
      <div className="auth-visual register">
        <div className="auth-drop">*</div>
        <h2>Tao tai khoan<br />trong vai phut.</h2>
        <p>Theo doi don hang va luu thong tin nhan hang tien loi hon.</p>
      </div>
      <div className="auth-card">
        <span className="eyebrow">THANH VIEN MOI</span>
        <h1>Dang ky tai khoan</h1>
        <p>Da co tai khoan? <Link to="/dang-nhap">Dang nhap</Link></p>

        {!pendingEmail ? (
          <form onSubmit={submit}>
            <label>Ho va ten
              <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <div className="form-grid two">
              <label>Email
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>So dien thoai
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </label>
            </div>
            <div className="form-grid two">
              <label>Mat khau
                <input type="password" minLength="6" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </label>
              <label>Xac nhan mat khau
                <input type="password" minLength="6" required value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
              </label>
            </div>
            <button className="btn btn-primary full" disabled={busy}>
              {busy ? 'Dang gui ma...' : 'Gui ma xac thuc'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify}>
            <p className="legal-note">{notice}. Email: <strong>{pendingEmail}</strong></p>
            <label>Ma xac thuc
              <input
                inputMode="numeric"
                maxLength="6"
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
            <button className="btn btn-primary full" disabled={busy || code.length !== 6}>
              {busy ? 'Dang xac thuc...' : 'Xac thuc va tao tai khoan'}
            </button>
            <button type="button" className="btn btn-ghost full" onClick={changeEmail} disabled={busy}>
              Doi thong tin dang ky
            </button>
          </form>
        )}

        <small className="legal-note">Mat khau toi thieu 6 ky tu. Khong su dung mat khau quan trong cua ban.</small>
      </div>
    </div>
  )
}
