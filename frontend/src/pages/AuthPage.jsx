import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setMessage('Mật khẩu xác nhận không khớp.')
          setLoading(false)
          return
        }
        const user = await register({ fullName, email, password, phone, address })
        navigate(user.role === 'admin' ? '/admin' : '/')
      } else {
        const user = await login({ email, password })
        navigate(user.role === 'admin' ? '/admin' : '/')
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể đăng nhập/đăng ký. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <button className="auth-back" onClick={() => navigate('/')}>
          ← Quay lại shop
        </button>
        <div className="auth-visual-copy">
          <p className="eyebrow">AUTOBOT / BUILDER'S CLUB</p>
          <h1>
            Build your
            <br />
            <em>legend.</em>
          </h1>
          <p>Một tài khoản để lưu kit yêu thích, theo dõi đơn hàng và tiếp tục hành trình lắp ráp của bạn.</p>
        </div>
        <div className="auth-stamp">
          GH
          <br />
          <span>EST. 2024</span>
        </div>
      </div>

      <div className="auth-form-wrap">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">AB</span>
          <span>AUTOBOT</span>
        </Link>

        <div className="auth-form">
          <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE BUILDERS'}</p>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p className="auth-note">
            {mode === 'login'
              ? 'Chào mừng bạn quay lại hệ sinh thái AUTOBOT.'
              : 'Tạo tài khoản riêng để đặt hàng và nhận ưu đãi độc quyền.'}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label>
                  Họ và tên
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                  />
                </label>
                <label>
                  Địa chỉ giao hàng mặc định
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, đường, quận/huyện, TP"
                  />
                </label>
              </>
            )}

            <label>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Mật khẩu
              <input
                required
                type="password"
                minLength="6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {mode === 'register' && (
              <label>
                Xác nhận mật khẩu
                <input
                  required
                  type="password"
                  minLength="6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            )}

            <button className="primary-button full" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập ↗' : 'Tạo tài khoản ↗'}
            </button>
          </form>

          {message && <p className="auth-message">{message}</p>}

          <p className="auth-switch">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setMessage('')
              }}
            >
              {mode === 'login' ? 'Tạo tài khoản ngay' : 'Đăng nhập'}
            </button>
          </p>

          <div className="auth-demo" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed var(--line)' }}>
            <span style={{ fontSize: '11px', display: 'block', marginBottom: '8px', color: 'var(--muted)' }}>
              Tài khoản thử nghiệm sẵn có:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@autobot.local', 'Password123!')}
                style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--line)', background: '#fff' }}
              >
                👑 Admin (admin@autobot.local)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('user@autobot.local', 'Password123!')}
                style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--line)', background: '#fff' }}
              >
                👤 Khách (user@autobot.local)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
