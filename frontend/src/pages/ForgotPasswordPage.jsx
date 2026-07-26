import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icons'

function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        minLength="6"
        maxLength="100"
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </span>
  )
}

export default function ForgotPasswordPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [passwords, setPasswords] = useState({ password: '', confirmation: '' })
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const requestCode = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const response = await api.post('/auth/password/forgot', { email: email.trim() })
      setEmail(email.trim())
      setNotice(response.data.message)
      setStep('code')
    } catch (error) {
      alert(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const response = await api.post('/auth/password/verify-code', {
        email,
        code,
      })
      setResetToken(response.data.resetToken)
      setStep('password')
    } catch (error) {
      alert(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    if (busy) return
    if (passwords.password !== passwords.confirmation) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp')
      return
    }
    setBusy(true)
    try {
      const response = await api.post('/auth/password/reset', {
        resetToken,
        newPassword: passwords.password,
        newPasswordConfirmation: passwords.confirmation,
      })
      navigate('/dang-nhap', {
        replace: true,
        state: { passwordResetMessage: response.data.message, email },
      })
    } catch (error) {
      alert(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual password-recovery-visual">
        <div className="auth-drop">✦</div>
        <h2>Khôi phục an toàn,<br />trở lại thật nhanh.</h2>
        <p>Mã xác thực chỉ có hiệu lực trong thời gian ngắn và chỉ dùng được một lần.</p>
      </div>
      <div className="auth-card password-recovery-card">
        <span className="eyebrow">BẢO MẬT TÀI KHOẢN</span>
        <h1>Quên mật khẩu</h1>
        <div className="recovery-progress" aria-label="Tiến trình đặt lại mật khẩu">
          <span className={step === 'email' ? 'active' : 'done'}>1</span>
          <i />
          <span className={step === 'code' ? 'active' : step === 'password' ? 'done' : ''}>2</span>
          <i />
          <span className={step === 'password' ? 'active' : ''}>3</span>
        </div>

        {step === 'email' && (
          <>
            <p>Nhập email đã đăng ký để nhận mã xác thực gồm 6 chữ số.</p>
            <form onSubmit={requestCode}>
              <label>
                Email tài khoản
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ban@email.com"
                />
              </label>
              <button className="btn btn-primary full" disabled={busy}>
                {busy ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
              </button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="recovery-notice">{notice}. Kiểm tra cả thư mục spam.</p>
            <form onSubmit={verifyCode}>
              <label>
                Mã xác thực gửi đến {email}
                <input
                  className="verification-code-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength="6"
                  required
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </label>
              <button className="btn btn-primary full" disabled={busy || code.length !== 6}>
                {busy ? 'Đang xác thực...' : 'Xác thực mã'}
              </button>
              <button
                type="button"
                className="btn btn-ghost full"
                onClick={() => {
                  setStep('email')
                  setCode('')
                }}
                disabled={busy}
              >
                Đổi email hoặc gửi lại mã
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <p>Mã đã được xác thực. Hãy tạo mật khẩu mới cho tài khoản.</p>
            <form onSubmit={resetPassword}>
              <label>
                Mật khẩu mới
                <PasswordInput
                  value={passwords.password}
                  onChange={(event) => setPasswords({ ...passwords, password: event.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                />
              </label>
              <label>
                Xác nhận mật khẩu mới
                <PasswordInput
                  value={passwords.confirmation}
                  onChange={(event) => setPasswords({ ...passwords, confirmation: event.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
              </label>
              <button className="btn btn-primary full" disabled={busy}>
                {busy ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
        )}

        <Link className="back-to-login" to="/dang-nhap">
          <span aria-hidden="true">←</span> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}
