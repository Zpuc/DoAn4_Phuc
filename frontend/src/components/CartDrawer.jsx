import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'

export default function CartDrawer() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    items,
    updateQuantity,
    removeItem,
    totalCount,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    showToast
  } = useCart()

  if (!isCartOpen) return null

  return (
    <div className="overlay" onClick={() => setIsCartOpen(false)}>
      <aside className="cart-panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">YOUR BUILD LIST</p>
            <h2>
              Giỏ hàng <span>({totalCount})</span>
            </h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} aria-label="Đóng giỏ hàng">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span>＋</span>
            <p>Giỏ hàng đang trống.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Hãy khám phá các kit Gundam hot nhất để bắt đầu!</p>
            <button className="primary-button" style={{ marginTop: '16px' }} onClick={() => setIsCartOpen(false)}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong>{item.name}</strong>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{ border: 0, background: 'none', color: 'var(--muted)', fontSize: '16px', padding: '0 4px', lineHeight: 1 }}
                        title="Xóa món này"
                      >
                        ×
                      </button>
                    </div>
                    <small>{item.grade}</small>
                    <p>{money(item.price)}</p>
                    <div className="quantity">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div>
                <span>Tạm tính</span>
                <strong>{money(totalAmount)}</strong>
              </div>
              <small>
                {totalAmount >= 1500000 ? (
                  <span style={{ color: '#38a169', fontWeight: 600 }}>🎉 Đủ điều kiện miễn phí vận chuyển toàn quốc!</span>
                ) : (
                  <span>Thêm {money(1500000 - totalAmount)} để được miễn phí vận chuyển.</span>
                )}
              </small>
              <button
                className="primary-button full"
                onClick={() => {
                  setIsCartOpen(false)
                  if (!user) {
                    showToast('Vui lòng đăng nhập để tiến hành đặt hàng.')
                    navigate('/dang-nhap')
                    return
                  }
                  setIsCheckoutOpen(true)
                }}
              >
                Tiến hành đặt hàng ↗
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
