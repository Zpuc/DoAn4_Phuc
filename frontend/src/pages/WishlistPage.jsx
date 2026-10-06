import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'

export default function WishlistPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem, showToast } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadWishlist = async () => {
    try {
      const { data } = await apiClient.get('/wishlist')
      setItems(data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/dang-nhap')
      return
    }
    loadWishlist()
  }, [user, navigate])

  const handleRemove = async (productId) => {
    try {
      await apiClient.delete(`/wishlist/${productId}`)
      setItems((prev) => prev.filter((item) => item.id !== productId))
      showToast('Đã xóa sản phẩm khỏi danh sách yêu thích.')
    } catch {
      // ignore
    }
  }

  const handleAddToCart = (product) => {
    addItem(product, 1)
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main style={{ padding: '60px 8vw 100px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <p className="eyebrow">AUTOBOT / BỘ SƯU TẬP CỦA TÔI</p>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 12px', letterSpacing: '-0.05em' }}>
          Kit yêu thích ({items.length})
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '36px' }}>
          Lưu lại những mẫu Gundam mơ ước để theo dõi giá và thêm vào giỏ bất kỳ lúc nào.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Đang tải danh sách yêu thích...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🤍</span>
            <h3>Danh sách yêu thích đang trống</h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>
              Hãy bấm vào biểu tượng trái tim ở các sản phẩm để lưu lại tại đây!
            </p>
            <Link to="/#shop" className="primary-button">
              Khám phá sản phẩm ↗
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {items.map((product) => (
              <article
                key={product.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ position: 'relative', height: '220px', background: '#f5f2ec', marginBottom: '14px' }}>
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85'}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => handleRemove(product.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#fff',
                        border: 0,
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        fontSize: '14px',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                      title="Xóa khỏi yêu thích"
                    >
                      ❤️
                    </button>
                  </div>

                  <span style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    {product.grade || product.category_name}
                  </span>
                  <h3 style={{ fontSize: '15px', margin: '4px 0 8px' }}>
                    <Link to={`/san-pham/${product.id}`} style={{ color: 'inherit' }}>
                      {product.name}
                    </Link>
                  </h3>
                  <strong style={{ fontSize: '16px', color: 'var(--accent)' }}>
                    {money(product.price)}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    className="primary-button"
                    style={{ flex: 1, padding: '10px 14px', justifyContent: 'center' }}
                    onClick={() => handleAddToCart(product)}
                  >
                    Thêm vào giỏ ↗
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
