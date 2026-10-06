import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Navbar({ onSearchFocus }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { totalCount, setIsCartOpen, toast } = useCart()
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserDropdown(false)
    navigate('/')
  }

  return (
    <>
      <div className="announcement">
        MIỄN PHÍ VẬN CHUYỂN ĐƠN TỪ 1.500.000đ <span>·</span> ĐỔI TRẢ TRONG 7 NGÀY <span>·</span> CAM KẾT CHÍNH HÃNG BANDAI
      </div>

      <header className="site-header">
        <Link className="brand" to="/" aria-label="AUTOBOT home">
          <span className="brand-mark">AB</span>
          <span>AUTOBOT</span>
        </Link>

        <nav>
          <a href="/#shop">Shop</a>
          <a href="/#grades">Chọn theo grade</a>
          <Link to="/cam-nang">Cẩm nang Builder</Link>
          <a href="/#story">Về chúng tôi</a>
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="Tìm kiếm"
            onClick={() => {
              if (onSearchFocus) {
                onSearchFocus()
              } else {
                const searchEl = document.querySelector('#search')
                if (searchEl) searchEl.focus()
                else navigate('/#shop')
              }
            }}
          >
            ⌕
          </button>

          {/* Quick Wishlist link */}
          <Link
            to="/yeu-thich"
            className="icon-button"
            style={{ fontSize: '16px', lineHeight: 1, transform: 'none', color: 'var(--ink)' }}
            title="Kit yêu thích"
          >
            🤍
          </Link>

          {user ? (
            <div className="user-dropdown-container" style={{ position: 'relative' }}>
              <button
                className="account-button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>👤 {user.fullName || user.email.split('@')[0]}</span>
                <small style={{ fontSize: '9px' }}>▼</small>
              </button>

              {showUserDropdown && (
                <div
                  className="user-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    background: '#fff',
                    border: '1px solid var(--line)',
                    boxShadow: '0 8px 24px rgba(20, 32, 42, 0.12)',
                    minWidth: '190px',
                    zIndex: 100,
                    padding: '8px 0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserDropdown(false)}
                      style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}
                    >
                      ⚙️ Quản trị (Admin)
                    </Link>
                  )}
                  <Link
                    to="/don-hang"
                    onClick={() => setShowUserDropdown(false)}
                    style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--ink)' }}
                  >
                    📦 Đơn hàng của tôi
                  </Link>
                  <Link
                    to="/yeu-thich"
                    onClick={() => setShowUserDropdown(false)}
                    style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--ink)' }}
                  >
                    🤍 Kit đã yêu thích
                  </Link>
                  <Link
                    to="/ho-so"
                    onClick={() => setShowUserDropdown(false)}
                    style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--ink)' }}
                  >
                    👤 Hồ sơ & Sổ địa chỉ
                  </Link>
                  <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      color: '#c53030',
                      background: 'none',
                      border: 0,
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="account-button" to="/dang-nhap">
              Đăng nhập
            </Link>
          )}

          <button className="cart-button" onClick={() => setIsCartOpen(true)}>
            Giỏ hàng <b>{totalCount}</b>
          </button>
        </div>
      </header>

      {toast && <div className="toast">✓ {toast}</div>}
    </>
  )
}
