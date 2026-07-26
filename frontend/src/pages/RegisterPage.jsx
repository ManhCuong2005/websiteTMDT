import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { errorMessage } from '../services/api'
import { Icon } from '../components/Icons'
import { useLanguage } from '../contexts/LanguageContext'

export default function RegisterPage() {
  const { user, register, verifyRegistration } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [code, setCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return alert(t('Mật khẩu xác nhận không khớp'))
    setBusy(true)
    try {
      const response = await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      setPendingEmail(response.email)
      setNotice(response.message || 'Mã xác thực đã được gửi đến email của bạn')
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
        <h2>Tạo tài khoản<br />trong vài phút.</h2>
        <p>Theo dõi đơn hàng và lưu thông tin nhận hàng tiện lợi hơn.</p>
      </div>
      <div className="auth-card">
        <span className="eyebrow">THÀNH VIÊN MỚI</span>
        <h1>Đăng ký tài khoản</h1>
        <p>Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></p>

        {!pendingEmail ? (
          <form onSubmit={submit}>
            <label>Họ và tên
              <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <div className="form-grid two">
              <label>Email
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>Số điện thoại
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </label>
            </div>
            <div className="form-grid two">
              <label>Mật khẩu
                <span className="password-field">
                  <input type={showPassword ? 'text' : 'password'} minLength="6" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </span>
              </label>
              <label>Xác nhận mật khẩu
                <span className="password-field">
                  <input type={showConfirm ? 'text' : 'password'} minLength="6" required value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm((current) => !current)}
                    aria-label={showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                    title={showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                  >
                    <Icon name={showConfirm ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </span>
              </label>
            </div>
            <button className="btn btn-primary full" disabled={busy}>
              {busy ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify}>
            <p className="legal-note">{notice}. Email: <strong>{pendingEmail}</strong></p>
            <label>Mã xác thực
              <input
                inputMode="numeric"
                maxLength="6"
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
            <button className="btn btn-primary full" disabled={busy || code.length !== 6}>
              {busy ? 'Đang xác thực...' : 'Xác thực và tạo tài khoản'}
            </button>
            <button type="button" className="btn btn-ghost full" onClick={changeEmail} disabled={busy}>
              Đổi thông tin đăng ký
            </button>
          </form>
        )}

        <small className="legal-note">Mật khẩu tối thiểu 6 ký tự. Không sử dụng mật khẩu quan trọng của bạn.</small>
      </div>
    </div>
  )
}
