import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/client.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function ArticleDetailPage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem, showToast } = useCart()

  useEffect(() => {
    window.scrollTo(0, 0)
    apiClient
      .get(`/articles/${slug}`)
      .then(({ data }) => setArticle(data))
      .catch(() => setError('Không tìm thấy bài viết.'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAddToCart = () => {
    if (!article || !article.product_id) return
    const productItem = {
      id: article.product_id,
      name: article.product_name,
      price: article.product_price,
      image_url: article.product_image,
      grade: article.product_grade,
      sku: article.product_sku,
      stock_quantity: article.product_stock || 10
    }
    addItem(productItem, 1)
    showToast(`Đã thêm ${article.product_name} vào giỏ hàng!`)
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main style={{ padding: '60px 8vw 100px', maxWidth: '880px', margin: '0 auto', width: '100%' }}>
        <Link
          to="/cam-nang"
          style={{
            fontSize: '13px',
            color: 'var(--muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '28px',
            textDecoration: 'none',
            fontFamily: 'DM Mono'
          }}
        >
          ← Quay lại danh sách cẩm nang & lọc mô hình
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)' }}>
            Đang tải nội dung bài viết...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#c53030' }}>
            {error}
          </div>
        ) : article ? (
          <article>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'DM Mono',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}
              >
                {article.category_tag}
              </span>
              {article.related_grade && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'DM Mono',
                    background: 'var(--dark)',
                    color: '#fff',
                    padding: '3px 8px',
                    fontWeight: 600
                  }}
                >
                  {article.related_grade}
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                · 👁 {article.views_count.toLocaleString('vi-VN')} lượt đọc
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                margin: '0 0 20px',
                lineHeight: 1.25,
                letterSpacing: '-0.04em'
              }}
            >
              {article.title}
            </h1>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                color: 'var(--muted)',
                fontSize: '13px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '16px',
                marginBottom: '28px'
              }}
            >
              <span>Tác giả: <strong style={{ color: 'var(--dark)' }}>{article.author_name}</strong></span>
              <span>Ngày đăng: {new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
            </div>

            {article.cover_image && (
              <div style={{ marginBottom: '32px', border: '1px solid var(--line)', overflow: 'hidden' }}>
                <img
                  src={article.cover_image}
                  alt={article.title}
                  style={{ width: '100%', maxHeight: '440px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            {/* Excerpt callout */}
            {article.excerpt && (
              <div
                style={{
                  padding: '18px 22px',
                  background: '#faf9f5',
                  borderLeft: '4px solid var(--accent)',
                  marginBottom: '28px',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  color: '#4a5568'
                }}
              >
                {article.excerpt}
              </div>
            )}

            {/* Article Content */}
            <div
              style={{
                fontSize: '15.5px',
                lineHeight: 1.85,
                color: '#2d3748',
                whiteSpace: 'pre-line',
                marginBottom: '48px'
              }}
            >
              {article.content}
            </div>

            {/* Featured Product Box if the article is linked to a model */}
            {article.product_id && article.product_name && (
              <div
                style={{
                  background: '#fff',
                  border: '2px solid var(--dark)',
                  padding: '24px',
                  marginBottom: '40px',
                  display: 'flex',
                  gap: '24px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                {article.product_image && (
                  <div style={{ width: '120px', height: '120px', flexShrink: 0, background: '#f5f5f5', border: '1px solid var(--line)' }}>
                    <img
                      src={article.product_image}
                      alt={article.product_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700 }}>
                    MÔ HÌNH TRONG BÀI VIẾT
                  </span>
                  <h3 style={{ margin: '4px 0 8px', fontSize: '18px', lineHeight: 1.3 }}>
                    <Link to={`/san-pham/${article.product_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {article.product_name}
                    </Link>
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', fontFamily: 'DM Mono' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
                      {Number(article.product_price).toLocaleString('vi-VN')}đ
                    </span>
                    {article.product_grade && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', background: '#eee' }}>
                        {article.product_grade}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleAddToCart}
                      className="primary-button"
                      style={{ padding: '9px 18px', fontSize: '12.5px' }}
                    >
                      Thêm vào giỏ hàng
                    </button>
                    <Link
                      to={`/san-pham/${article.product_id}`}
                      className="secondary-button"
                      style={{ padding: '9px 18px', fontSize: '12.5px', textDecoration: 'none' }}
                    >
                      Xem chi tiết kit ↗
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Call-to-action */}
            <div style={{ padding: '28px', background: '#f7f6f2', border: '1px solid var(--line)', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Bạn muốn tìm thêm bài viết theo dòng mô hình khác?</h3>
              <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: 'var(--muted)', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
                Khám phá kho cẩm nang chia sẻ kỹ thuật lắp ráp Gunpla, so sánh các kit HG, RG, MG, PG tại AUTOBOT Store.
              </p>
              <Link to="/cam-nang" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Bộ lọc cẩm nang đầy đủ ↗
              </Link>
            </div>
          </article>
        ) : null}
      </main>

      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
