import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { errorMessage } from '../services/api'
import GoogleButton from '../components/GoogleButton'

export default function LoginPage() {
  const { user, login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)

  const destination = location.state?.from || '/'

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : destination} replace />
  }

  const goAfterLogin = (nextUser) => {
    navigate(nextUser.role === 'ADMIN' ? '/admin' : destination, { replace: true })
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    try {
      const nextUser = await login({
        email: form.email.trim(),
        password: form.password,
      })
      goAfterLogin(nextUser)
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onGoogle = useCallback(async (credential) => {
    try {
      const nextUser = await googleLogin(credential)
      goAfterLogin(nextUser)
    } catch (err) {
      alert(errorMessage(err))
    }
  }, [googleLogin, destination])

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-drop">◆</div>
        <h2>Nguồn nước tốt,<br />khởi đầu sống khỏe.</h2>
        <p>Đăng nhập để quản lý giỏ hàng, đơn mua và địa chỉ giao hàng.</p>
      </div>
      <div className="auth-card">
        <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
        <h1>Đăng nhập</h1>
        <p>Chưa có tài khoản? <Link to="/dang-ky">Đăng ký miễn phí</Link></p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="ban@email.com"
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn btn-primary full" disabled={busy}>
            {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <div className="auth-divider"><span>hoặc</span></div>
        <GoogleButton onCredential={onGoogle} />
        <div className="demo-account">
          <b>Tài khoản admin mẫu</b>
          <code>admin@banhang.vn / Admin@123</code>
        </div>
      </div>
    </div>
  )
}
