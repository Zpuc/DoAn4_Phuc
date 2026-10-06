import { useEffect, useState, useMemo } from 'react'
import apiClient from '../api/client.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'
import { ProductGridSkeleton } from '../components/SkeletonLoader.jsx'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('featured')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  const categories = [
    'Tất cả',
    'High Grade',
    'Real Grade',
    'Master Grade',
    'Perfect Grade',
    'Super Deformed'
  ]

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 12,
        sort: sortOption
      }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (activeCategory !== 'Tất cả') params.grade = activeCategory
      if (inStockOnly) params.inStock = 'true'

      const { data } = await apiClient.get('/products', { params })
      setProducts(data.data || [])
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1)
        setTotalProducts(data.pagination.total || 0)
      }
    } catch (err) {
      console.error('Failed to load products from API:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [activeCategory, sortOption, inStockOnly, page])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchProducts()
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="app-shell">
      <Navbar onSearchFocus={() => document.querySelector('#search')?.focus()} />

      <main id="top">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">THE BUILDER'S DEPOT / 01</p>
            <h1>
              Build your
              <br />
              <em>legend.</em>
            </h1>
            <p className="hero-text">
              Mô hình Gundam chính hãng Bandai Spirits cho những builder đam mê kiến tạo thế giới mecha của riêng mình.
            </p>
            <a className="primary-button" href="#shop">
              Khám phá bộ sưu tập <span>↘</span>
            </a>
          </div>
          <div className="hero-art">
            <div className="sun" />
            <div className="hero-grid" />
            <div className="hero-label">
              BANDAI
              <br />
              <strong>SPIRITS</strong>
            </div>
            <div className="hero-model">
              RX
              <br />
              <span>78</span>
            </div>
            <div className="hero-spec">
              MODEL KIT / 1:144
              <br />
              EARTH FEDERATION
            </div>
          </div>
          <div className="hero-index">
            01 <span>/</span> 03
          </div>
        </section>

        {/* TRUST ROW */}
        <section className="trust-row">
          <div>
            <strong>100%</strong>
            <span>Chính hãng Bandai Nhật Bản</span>
          </div>
          <div>
            <strong>7 ngày</strong>
            <span>Đổi trả runner & khớp gãy</span>
          </div>
          <div>
            <strong>Toàn quốc</strong>
            <span>Đóng gói bubble wrap dày 3 lớp</span>
          </div>
          <div>
            <strong>Hỗ trợ</strong>
            <span>Tư vấn dụng cụ & kỹ thuật ráp</span>
          </div>
        </section>

        {/* SHOP SECTION */}
        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CURATED FOR BUILDERS</p>
              <h2>
                Kit nổi bật <span>↗</span>
              </h2>
            </div>
            <p className="section-note">
              Bộ sưu tập {totalProducts} kit Gunpla đang sẵn sàng giao tới tay builder.
            </p>
          </div>

          <div className="toolbar">
            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeCategory === category ? 'active' : ''}
                  onClick={() => {
                    setActiveCategory(category)
                    setPage(1)
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="controls">
              <label className="search-box">
                <span>⌕</span>
                <input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kit, series, mã SKU..."
                />
              </label>

              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value)
                  setPage(1)
                }}
                aria-label="Sắp xếp"
              >
                <option value="featured">Nổi bật</option>
                <option value="low">Giá thấp đến cao</option>
                <option value="high">Giá cao đến thấp</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked)
                    setPage(1)
                  }}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span>Chỉ còn hàng</span>
              </label>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : products.length > 0 ? (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="primary-button"
                    style={{ padding: '8px 16px', opacity: page <= 1 ? 0.5 : 1 }}
                  >
                    ← Trước
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid var(--ink)',
                        background: page === i + 1 ? 'var(--ink)' : 'transparent',
                        color: page === i + 1 ? '#fff' : 'var(--ink)',
                        fontWeight: 600
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="primary-button"
                    style={{ padding: '8px 16px', opacity: page >= totalPages ? 0.5 : 1 }}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              Không tìm thấy kit phù hợp với bộ lọc hiện tại. Thử từ khóa khác nhé.
            </div>
          )}
        </section>

        {/* GRADE SECTION */}
        <section className="grade-section" id="grades">
          <div>
            <p className="eyebrow">FIND YOUR BUILD</p>
            <h2>
              Chọn theo
              <br />
              <em>grade.</em>
            </h2>
          </div>
          <div className="grade-list">
            <button
              onClick={() => {
                setActiveCategory('High Grade')
                document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>01</span>
              <strong>High Grade</strong>
              <small>Dễ bắt đầu · 1/144</small>
              <b>↗</b>
            </button>
            <button
              onClick={() => {
                setActiveCategory('Real Grade')
                document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>02</span>
              <strong>Real Grade</strong>
              <small>Chi tiết cao · 1/144</small>
              <b>↗</b>
            </button>
            <button
              onClick={() => {
                setActiveCategory('Master Grade')
                document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>03</span>
              <strong>Master Grade</strong>
              <small>Trải nghiệm đầy đủ · 1/100</small>
              <b>↗</b>
            </button>
            <button
              onClick={() => {
                setActiveCategory('Perfect Grade')
                document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>04</span>
              <strong>Perfect Grade</strong>
              <small>Đỉnh cao tỉ lệ · 1/60</small>
              <b>↗</b>
            </button>
          </div>
        </section>

        {/* STORY SECTION */}
        <section className="story-section" id="story">
          <div className="story-number">
            AB
            <br />
            <span>EST. 2024</span>
          </div>
          <div>
            <p className="eyebrow">A LITTLE ABOUT US</p>
            <h2>
              Không chỉ là
              <br />
              một chiếc hộp.
            </h2>
            <p>
              AUTOBOT là không gian thương mại điện tử chuyên nghiệp dành riêng cho cộng đồng builder Việt Nam. Từng mẫu kit được nhập khẩu nguyên seal từ Bandai Spirits, bảo quản tiêu chuẩn và đóng gói với sự trân trọng cao nhất dành cho đam mê lắp ráp.
            </p>
            <a href="#shop">Khám phá sản phẩm ↗</a>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
