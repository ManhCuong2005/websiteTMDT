import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { errorMessage } from '../services/api'
import GoogleButton from '../components/GoogleButton'
import { Icon } from '../components/Icons'
import FaceCaptureDialog from '../components/FaceCaptureDialog'

export default function LoginPage() {
  const { user, login, googleLogin, acceptAuthResponse } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [faceOpen, setFaceOpen] = useState(false)

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

  const openFaceLogin = () => {
    const email = form.email.trim()
    if (!email || !email.includes('@')) {
      alert('Vui lòng nhập email hợp lệ trước khi xác thực gương mặt.')
      return
    }
    setFaceOpen(true)
  }

  const onFaceAuthenticated = (response) => {
    const nextUser = acceptAuthResponse(response)
    setFaceOpen(false)
    goAfterLogin(nextUser)
  }

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
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="••••••••"
              />
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
          <button type="submit" className="btn btn-primary full" disabled={busy}>
            {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <button
            type="button"
            className="btn btn-outline full face-login-button"
            onClick={openFaceLogin}
            disabled={busy}
          >
            <Icon name="camera" size={19} />
            Đăng nhập bằng gương mặt
          </button>
        </form>
        <div className="auth-divider"><span>hoặc</span></div>
        <GoogleButton onCredential={onGoogle} />
        <div className="demo-account">
          <b>Tài khoản admin mẫu</b>
          <code>admin@banhang.vn / Admin@123</code>
        </div>
      </div>
      {faceOpen && (
        <FaceCaptureDialog
          mode="login"
          email={form.email.trim()}
          onClose={() => setFaceOpen(false)}
          onAuthenticated={onFaceAuthenticated}
        />
      )}
    </div>
  )
}
