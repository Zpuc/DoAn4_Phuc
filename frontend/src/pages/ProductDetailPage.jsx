import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/client.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'
import { ProductDetailSkeleton } from '../components/SkeletonLoader.jsx'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'

const getCondition = (product) => {
  if (product.condition_status === 'het_hang' || product.stock_quantity <= 0) return 'Hết hàng'
  if (product.condition_status === 'sap_co_hang') return 'Sắp có hàng'
  if (product.stock_quantity <= 5) return `Sắp hết (Chỉ còn ${product.stock_quantity} bộ)`
  return `Còn hàng (${product.stock_quantity} sản phẩm trong kho)`
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, setIsCheckoutOpen, showToast } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)

  // Review submission state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewNotice, setReviewNotice] = useState('')

  const loadProduct = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get(`/products/${id}`)
      setProduct(data)
      setActiveImage(data.image_url || '')
    } catch {
      setError('Không tìm thấy hoặc không tải được thông tin sản phẩm.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
    window.scrollTo(0, 0)
    if (user && id) {
      apiClient
        .get('/wishlist')
        .then(({ data }) => {
          setIsFavorited((data || []).some((item) => Number(item.id) === Number(id)))
        })
        .catch(() => {})
    }
  }, [id, user])

  const handleAddToCart = () => {
    if (!product || product.stock_quantity <= 0) return
    addItem(product, quantity)
  }

  const handleToggleWishlist = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để lưu kit vào yêu thích.')
      navigate('/dang-nhap')
      return
    }
    try {
      const { data } = await apiClient.post(`/wishlist/${id}`)
      setIsFavorited(data.added)
      showToast(data.message)
    } catch {
      showToast('Không thể cập nhật danh sách yêu thích.')
    }
  }

  const handleBuyNow = () => {
    if (!product || product.stock_quantity <= 0) return
    addItem(product, quantity)
    setIsCheckoutOpen(true)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setReviewNotice('Vui lòng đăng nhập để gửi nhận xét.')
      return
    }
    setSubmittingReview(true)
    setReviewNotice('')
    try {
      await apiClient.post(`/products/${id}/reviews`, { rating, comment })
      setReviewNotice('Cảm ơn bạn! Đánh giá đã được ghi nhận thành công.')
      setComment('')
      loadProduct()
    } catch (err) {
      setReviewNotice(err.response?.data?.message || 'Không thể gửi đánh giá.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const gallery = product
    ? [
        product.image_url,
        ...(product.gallery_images ? String(product.gallery_images).split('|').map((s) => s.trim()).filter(Boolean) : [])
      ].filter(Boolean)
    : []

  return (
    <div className="app-shell">
      <Navbar />

      {loading ? (
        <ProductDetailSkeleton />
      ) : error ? (
        <div className="simple-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ color: '#c53030', fontSize: '18px', marginBottom: '20px' }}>{error}</p>
          <Link to="/#shop" className="primary-button">
            ← Quay lại danh sách sản phẩm
          </Link>
        </div>
      ) : product ? (
        <main className="simple-page product-detail-page">
          <Link to="/#shop" style={{ display: 'inline-block', marginBottom: '20px', fontSize: '12px', color: 'var(--muted)' }}>
            ← Quay lại danh sách kit
          </Link>

          <div className="detail-layout">
            <div className="detail-gallery">
              <img
                className="detail-main-image"
                src={activeImage || gallery[0] || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85'}
                alt={product.name}
              />
              {gallery.length > 1 && (
                <div className="detail-thumbnail-row" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {gallery.slice(0, 5).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.name} thumb ${index + 1}`}
                      onClick={() => setActiveImage(img)}
                      style={{
                        width: '70px',
                        height: '70px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: activeImage === img ? '2px solid var(--accent)' : '1px solid var(--line)',
                        opacity: activeImage === img ? 1 : 0.7
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <section className="detail-info">
              <p className="eyebrow">{product.category_name || 'BANDAI SPIRITS'}</p>
              <h1>{product.name}</h1>

              <div className="detail-meta-line">
                <span>{product.grade || 'HG'}</span>
                <span>{product.scale || '1/144'}</span>
                <span>{product.manufacturer || 'Bandai Spirits'}</span>
                <span style={{ color: '#d69e2e', fontWeight: 600 }}>
                  ★ {Number(product.avg_rating || 5).toFixed(1)} ({product.review_count || 0} đánh giá)
                </span>
              </div>

              <div className="detail-price-row">
                <strong className="detail-price">{money(product.price)}</strong>
                {product.old_price && <span className="detail-old-price">{money(product.old_price)}</span>}
              </div>

              <p className="detail-status" style={{ color: product.stock_quantity > 0 ? '#276749' : '#c53030', fontWeight: 500 }}>
                ● {getCondition(product)}
              </p>

              <p className="detail-description">{product.description || 'Mô hình lắp ráp cao cấp chính hãng từ Bandai Spirits Nhật Bản.'}</p>

              {product.stock_quantity > 0 ? (
                <div className="detail-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="qty-box" style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', height: '48px' }}>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      style={{ width: '40px', height: '100%', border: 0, background: 'none', fontSize: '18px' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                      style={{ width: '40px', height: '100%', border: 0, background: 'none', fontSize: '18px' }}
                    >
                      +
                    </button>
                  </div>

                  <button className="primary-button" type="button" onClick={handleAddToCart} style={{ height: '48px' }}>
                    Thêm vào giỏ ↗
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    style={{
                      height: '48px',
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 0,
                      padding: '0 24px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mua ngay ⚡
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    title={isFavorited ? 'Xóa khỏi danh sách yêu thích' : 'Lưu kit vào danh sách yêu thích'}
                    style={{
                      height: '48px',
                      width: '48px',
                      background: isFavorited ? '#fff5f5' : '#fff',
                      border: `1px solid ${isFavorited ? '#e53e3e' : 'var(--line)'}`,
                      fontSize: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isFavorited ? '❤️' : '🤍'}
                  </button>
                </div>
              ) : (
                <div style={{ padding: '14px', background: '#fed7d7', color: '#9b2c2c', borderRadius: '4px', fontSize: '13px' }}>
                  Sản phẩm hiện đang hết hàng. Bạn có thể liên hệ fanpage hoặc quay lại sau khi restock.
                </div>
              )}

              <div className="detail-badges">
                <span>🛡️ Bảo hành {product.warranty_months || 12} tháng</span>
                <span>🎌 {product.origin || 'Nhật Bản'}</span>
                <span>📦 {product.series_name || 'Gundam'}</span>
                <span>🧩 {product.detail_count ? `${product.detail_count} chi tiết` : 'Snap-fit'}</span>
              </div>
            </section>
          </div>

          {/* TECH SPEC PANELS */}
          <div className="detail-panels">
            <section className="detail-panel">
              <h2>Thông số kỹ thuật sản phẩm</h2>
              <div className="detail-spec-grid">
                <div>
                  <label>Thương hiệu</label>
                  <strong>{product.manufacturer || 'Bandai Spirits'}</strong>
                </div>
                <div>
                  <label>Dòng phim / Series</label>
                  <strong>{product.series_name || 'Mobile Suit Gundam'}</strong>
                </div>
                <div>
                  <label>Phân loại Grade</label>
                  <strong>{product.grade || 'HG'}</strong>
                </div>
                <div>
                  <label>Tỉ lệ mô hình</label>
                  <strong>{product.scale || '1/144'}</strong>
                </div>
                <div>
                  <label>Vật liệu đúc</label>
                  <strong>{product.material || 'PS, ABS, PE'}</strong>
                </div>
                <div>
                  <label>Số lượng mảnh chi tiết</label>
                  <strong>{product.detail_count ? `${product.detail_count} mảnh` : 'Đang cập nhật'}</strong>
                </div>
                <div>
                  <label>Phụ kiện đi kèm</label>
                  <strong>{product.accessories || 'Vũ khí, decal, beam effect'}</strong>
                </div>
                <div>
                  <label>Phương thức lắp</label>
                  <strong>{product.assembly_type || 'Snap-fit (Không cần keo dán)'}</strong>
                </div>
                <div>
                  <label>Chiều cao hoàn thiện</label>
                  <strong>{product.height_cm ? `${product.height_cm} cm` : 'Tiêu chuẩn'}</strong>
                </div>
                <div>
                  <label>Kích thước hộp</label>
                  <strong>{product.box_size || 'Tiêu chuẩn Bandai'}</strong>
                </div>
              </div>
            </section>

            <section className="detail-panel">
              <h2>Chính sách bảo hành & Cam kết</h2>
              <div style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--ink)' }}>
                <p>
                  <strong>Chính sách AUTOBOT Store:</strong> {product.warranty_policy || 'Bảo hành chính hãng 12 tháng, đổi trả runner đúc lỗi trong 7 ngày.'}
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                  <li>Cam kết 100% hàng nhập khẩu chính ngạch từ Bandai Spirits Nhật Bản.</li>
                  <li>Hỗ trợ cung cấp linh kiện/runner thay thế nếu gặp sự cố gãy khớp trong quá trình lắp.</li>
                  <li>Giao hàng bọc bóng khí chống va đập 3 lớp bảo vệ tối đa hộp sản phẩm (Box collectors).</li>
                </ul>
              </div>
            </section>
          </div>

          {/* REVIEWS & COMMUNITY SECTION */}
          <section style={{ marginTop: '50px', background: '#fff', border: '1px solid var(--line)', padding: '36px' }}>
            <h2 style={{ fontSize: '24px', margin: '0 0 16px' }}>
              Đánh giá từ cộng đồng Builder ({product.reviews?.length || 0})
            </h2>

            {/* List existing reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>{rev.user_name || 'Builder ẩn danh'}</strong>
                      <span style={{ color: '#ecc94b', fontSize: '14px' }}>{'★'.repeat(rev.rating)}</span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--ink)' }}>{rev.comment}</p>
                    <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                      {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                    </small>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Chưa có đánh giá nào cho kit này. Hãy là người đầu tiên để lại cảm nhận!</p>
              )}
            </div>

            {/* Write a review form */}
            <div style={{ background: '#f8f7f3', padding: '20px', border: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 10px' }}>Gửi nhận xét của bạn</h3>
              {user ? (
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontFamily: 'DM Mono', display: 'block', marginBottom: '6px' }}>
                      ĐÁNH GIÁ SAO:
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      style={{ padding: '6px 12px', background: '#fff', border: '1px solid var(--line)' }}
                    >
                      <option value="5">★★★★★ - Tuyệt phẩm (5 sao)</option>
                      <option value="4">★★★★☆ - Rất tốt (4 sao)</option>
                      <option value="3">★★★☆☆ - Bình thường (3 sao)</option>
                      <option value="2">★★☆☆☆ - Chưa hài lòng (2 sao)</option>
                      <option value="1">★☆☆☆☆ - Rất tệ (1 sao)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontFamily: 'DM Mono', display: 'block', marginBottom: '6px' }}>
                      NHẬN XÉT CHI TIẾT:
                    </label>
                    <textarea
                      rows="3"
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm lắp ráp, độ vững của khớp, chi tiết decal..."
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: '#fff' }}
                    />
                  </div>

                  {reviewNotice && (
                    <p style={{ fontSize: '13px', color: reviewNotice.startsWith('Cảm ơn') ? '#276749' : '#c53030', marginBottom: '10px' }}>
                      {reviewNotice}
                    </p>
                  )}

                  <button type="submit" className="primary-button" disabled={submittingReview}>
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá ↗'}
                  </button>
                </form>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Vui lòng <Link to="/dang-nhap" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Đăng nhập</Link> để gửi nhận xét và đánh giá kit này.
                </div>
              )}
            </div>
          </section>
        </main>
      ) : null}

      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
