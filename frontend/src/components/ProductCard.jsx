import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import apiClient from '../api/client.js'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'

export default function ProductCard({ product, isInitiallyFavorited = false }) {
  const navigate = useNavigate()
  const { addItem, showToast } = useCart()
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(isInitiallyFavorited)

  const isOutOfStock = product.stock_quantity <= 0 || product.condition_status === 'het_hang'
  const isLowStock = !isOutOfStock && product.stock_quantity <= 5

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isOutOfStock) {
      addItem(product, 1)
    }
  }

  const handleToggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      showToast('Vui lòng đăng nhập để lưu kit vào yêu thích.')
      navigate('/dang-nhap')
      return
    }

    try {
      const { data } = await apiClient.post(`/wishlist/${product.id}`)
      setIsFavorited(data.added)
      showToast(data.message)
    } catch {
      showToast('Không thể cập nhật danh sách yêu thích.')
    }
  }

  const imageUrl = product.image_url || product.image || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85'

  return (
    <article className="product-card">
      <Link to={`/san-pham/${product.id}`} className="product-card-link" style={{ display: 'block', color: 'inherit' }}>
        <div className="product-image">
          <img src={imageUrl} alt={product.name} loading="lazy" />
          <span className="grade-tag">{product.grade || product.category_name || 'HG'}</span>

          {isOutOfStock ? (
            <span className="product-badge" style={{ background: '#718096' }}>Hết hàng</span>
          ) : isLowStock ? (
            <span className="product-badge" style={{ background: '#d69e2e' }}>Chỉ còn {product.stock_quantity}</span>
          ) : product.badge ? (
            <span className="product-badge">{product.badge}</span>
          ) : null}

          {/* Wishlist toggle button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 2,
              background: 'rgba(255,255,255,0.9)',
              border: 0,
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
            title={isFavorited ? 'Xóa khỏi yêu thích' : 'Lưu vào yêu thích'}
          >
            {isFavorited ? '❤️' : '🤍'}
          </button>

          {!isOutOfStock && (
            <button
              className="quick-add"
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Thêm ${product.name} vào giỏ`}
              title="Thêm nhanh vào giỏ"
            >
              +
            </button>
          )}
        </div>

        <div className="product-info">
          <p>{product.category_name || product.category || 'Mô hình Bandai'}</p>
          <h3>{product.name}</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '11px', color: '#ecc94b' }}>
            <span>{'★'.repeat(Math.round(product.avg_rating || 5))}</span>
            <span style={{ color: 'var(--muted)', fontSize: '10px' }}>({product.review_count || 0})</span>
          </div>

          <div className="price-row">
            <strong>{money(product.price)}</strong>
            {(product.old_price || product.oldPrice) && (
              <del>{money(product.old_price || product.oldPrice)}</del>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
